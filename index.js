const t = require('@babel/types');
const generate = require('@babel/generator').default;
const cloneDeep = require('lodash.clonedeep');
const toAst = require('./lib/toAst');
const getObjectName = require('./lib/getObjectName');
const defaultSchemas = require('./schemas');
const {isPure, asPure, getProp, getPropName, prependProp, removeProp, addProp, replaceProp} = require('./lib/object');
const defaultMethods = require('./methods');
const defaultObjectMethods = require('./methods/object');
const {set} = require("./methods");

const defaultSchemasNames = Object.keys(defaultSchemas);

const astObject = toAst(require('./schemas/object'));
const astArray = toAst(require('./schemas/array'));
const astRegexp = toAst(require('./schemas/regexp'));
const astEnum = toAst(require('./schemas/enum'));
const astAnyOf = toAst(require('./schemas/anyOf'));
const astAllOf = toAst(require('./schemas/allOf'));
const astConst = toAst(require('./schemas/const'));

const methodPropName = /^\$/;

module.exports = parseSchema;
module.exports.getAstSchema = getAstSchema;
module.exports.generateAjvSchema = generateAjvSchema;
module.exports.astToAjvSchema = astToAjvSchema;

/**
 * @param {string|function} code
 * @param {{schemas?: Object, methods?: Object<string, function>, functions?: Object<string, function>, objectOptions?: Object<string, function>, schemaVersion?: string}} params
 * @returns {Object}
 */
function parseSchema(code, params) {
	return generateAjvSchema(toAst(code), params);
}

function generateAjvSchema(ast, {
	schemas = {...defaultSchemas},
	methods = defaultMethods,
	functions,
	objectOptions = defaultObjectMethods,
	schemaVersion = '07'
} = {}) {
	const schema = astToAjvSchema(ast, {
		schemas,
		methods,
		functions,
		objectOptions,
		schemaVersion,
	});

	addDescription(ast, schema);
	replaceObjectKeysWithString(schema);
	replaceComments(schema);

	return toJsonObject(schema);
}

function getAstSchema(code, {schemas} = {}) {
	const schema = toAst(code);

	if (!schemas) return schema;

	let left;
	let right;

	if (t.isAssignmentExpression(schema)) {
		left = schema.left;
		right = schema.right;
	}
	else if (t.isArrowFunctionExpression(schema)) {
		if (schema.params.length > 0) {
			left = schema.params[0];
			right = schema.body;
		}
		else if (t.isAssignmentExpression(schema.body)) {
			left = schema.body.left;
			right = schema.body.right;
		}
	}

	if (left && right) {
		const name = getObjectName(left);

		schemas[name] = right;
	}

	return schema;
}

function toJsonObject(schema) {
	try {
		return JSON.parse(generate(schema).code);
	}
	catch (e) {
		throw e;
	}
}

function astToAjvSchema(root, params) {
	if (t.isAssignmentExpression(root)) {
		return astAssignToAjvSchema(root, params);
	}
	else if (isRightShiftWithObjects(root)) {
		return astRightShiftToAjvSchema(root, params);
	}
	else if (isBetweenExpression(root)) {
		return astBetweenExpressionToAjvSchema(root, params);
	}
	else if (isNumberRangeExpression(root)) {
		return astNumberRangeExpressionToAjvSchema(root, params);
	}
	else if (isObjectName(root) || t.isNullLiteral(root)) {
		return astObjectNameToAjvSchema(root, params);
	}
	else if (t.isObjectExpression(root)) {
		return astObjectToAjvSchema(root, params);
	}
	else if (t.isArrayExpression(root)) {
		return astArrayToAjvSchema(root, params);
	}
	else if (t.isLogicalExpression(root)) {
		return astEnumToAjvSchema(root, params);
	}
	else if (isNumber(root) || t.isStringLiteral(root) || t.isBooleanLiteral(root)) {
		return astValueLiteralToAjvSchema(root, params);
	}
	else if (t.isRegExpLiteral(root)) {
		return astRegexToAjvSchema(root, params);
	}
	else if (t.isCallExpression(root)) {
		return astCallExpToAjvSchema(root, params);
	}
	else if (t.isArrowFunctionExpression(root)) {
		return astArrowFunctionToAjvSchema(root, params);
	}
	else if (t.isUnaryExpression(root) && root.operator === '!') {
		return astUnaryToAjvSchema(root, params);
	}
	else {
		throw new Error(`Unknown scheme node: ${root.type}`);
	}
}

function astAssignToAjvSchema(root, params) {
	const {schemas} = params;
	const {right} = root;
	const name = getSchemaName(root);
	const schema = astToAjvSchema(right, params);

	addSchemaName(schema, name);
	addDescription(root, schema);

	schemas[name] = asPure(cloneDeep(schema));

	return schema;
}

function astObjectToAjvSchema(root, params) {
	const {objectOptions} = params;

	const obj = cloneDeep(astObject);
	var required = getProp(obj, 'required');
	var properties = getProp(obj, 'properties');

	var props = [];
	var patternProps = [];

	const restoreProps = function () {
		required = getProp(obj, 'required');
		properties = getProp(obj, 'properties');
	};

	const flush = function () {
		if (props.length === 0) return;

		defaultMethods.set(obj, [t.objectExpression(props)], {clone: false});
		props = [];

		restoreProps();
	};

	const toggleRequired = function (name, add) {
		const list = required.value.elements;

		if (add) {
			if (list.every(s => s.value !== name)) {
				list.push(t.stringLiteral(name));
			}
		}
		else {
			required.value.elements = list.filter(s => s.value !== name);
		}
	};

	for (let prop of root.properties) {
		if (t.isSpreadElement(prop)) {
			flush();

			let src = prop.argument;
			const pure = isPure(src);

			if (pure) {
				prop.argument = src = src.argument.argument;
			}

			defaultMethods[pure ? 'set' : 'merge'](obj, [src], {clone: false, ...params});

			restoreProps();

			continue;
		}

		if (!t.isObjectProperty(prop)) {
			throw new Error(`Invalid object element: ${prop.type}`);
		}

		if (t.isRegExpLiteral(prop.key)) {
			patternProps.push(prop);
			continue;
		}

		let {value} = prop;
		let name = getPropName(prop);
		let optional = prop.computed;

		if (methodPropName.test(name)) {
			let method = name.slice(1);

			if (objectOptions.hasOwnProperty(method)) {
				objectOptions[method](obj, [prop.value], {clone: false, ...params});
				restoreProps();
				continue;
			}
		}

		if (t.isIdentifier(value) && value.name === 'undefined') {
			toggleRequired(name, false);
			removeProp(properties.value, name);
			continue;
		}

		toggleRequired(name, !optional);

		prop.computed = false; // [key]: => key:
		prop.value = astToAjvSchema(value, params);

		if (
			prop.leadingComments ||
			prop.trailingComments
		) {
			const {leadingComments} = prop;
			const index = root.properties.indexOf(prop);
			const prev = index > 0 && root.properties[index - 1];

			if (
				leadingComments &&
				prev &&
				prev.loc.end.line === leadingComments[0].loc.start.line
			) {
				addDescription(leadingComments[0], prev.value);

				if (leadingComments.length > 1) {
					addDescription(prop.leadingComments.slice(1), prop.value);
				}
				else if (prop.trailingComments) {
					addDescription(prop.trailingComments, prop.value);
				}
			}
			else {
				addDescription(prop, prop.value);
			}
		}

		replaceProp(properties.value, prop);
	}

	flush();

	if (patternProps.length > 0) {
		addProp(obj, 'patternProperties', t.objectExpression(patternProps.map(prop => {
			return t.objectProperty(
				t.stringLiteral(prop.key.pattern),
				astToAjvSchema(prop.value, params)
			);
		})))
	}

	addDescription(root, obj);

	return obj;
}

function astObjectNameToAjvSchema(root, params) {
	const {schemas} = params;
	const name = getObjectName(root);
	const ast = schemas[name];

	if (!ast) {
		throw new Error(`Unknown OBJECT_NAME: ${name}`);
	}

	const schema = astToAjvSchema(cloneDeep(ast), params);

	addSchemaName(schema, name);

	return schema;
}

function astArrayToAjvSchema(root, params, exact) {
	const arr = cloneDeep(astArray);
	const {elements} = root;
	const {schemaVersion} = params;
	const v2020 = schemaVersion === '2020';

	exact = exact === true;

	if (exact) {
		if (elements.some(el => t.isSpreadElement(el))) {
			throw new Error(`Invalid array syntax. Exclamation sign with spread is not allowed`);
		}

		addProp(arr, 'minItems', t.numericLiteral(elements.length));
		addProp(arr, 'maxItems', t.numericLiteral(elements.length));
	}

	switch (elements.length) {
	case 0:
		break;
	case 1:
		let element = elements[0];

		if (t.isSpreadElement(element)) {
			addProp(arr, 'contains', astToAjvSchema(element.argument, params));
		}
		else {
			addProp(arr, 'items', astToAjvSchema(element, params));
		}
		break;
	default:
		let spreads = elements.filter(el => t.isSpreadElement(el));

		if (spreads.length > 1) {
			throw new Error(`Invalid array syntax. Only one spread allowed`);
		}

		addProp(
			arr,
			v2020 ? 'prefixItems' : 'items',
			t.arrayExpression(
				elements
				.filter(el => !t.isSpreadElement(el))
				.map(el => astToAjvSchema(el, params))
			)
		);

		if (spreads.length > 0) {
			addProp(arr, v2020 ? 'items' : 'additionalItems', astToAjvSchema(spreads[0].argument, params));
		}

		break;
	}

	return arr;
}

function astEnumToAjvSchema(root, params) {
	const items = [];

	const traverse = function (node, cb) {
		const {left, right, operator} = node;

		if (operator !== '||' && operator !== '&&') {
			throw new Error(`Invalid enum operator: ${operator}`);
		}

		if (operator !== root.operator) {
			throw new Error(`All operators of enum should be same type: ${root.operator}`);
		}

		if (t.isLogicalExpression(left) && !(left.extra && left.extra.parenthesized)) {
			traverse(left, cb);
		}
		else if (cb(left) === false) {
			return;
		}

		if (t.isLogicalExpression(right) && !(right.extra && right.extra.parenthesized)) {
			traverse(right, cb);
		}
		else {
			cb(right);
		}
	};

	const add = function (item) {
		if (isEnum && (t.isStringLiteral(item) || isNumber(item))) {
			items.push(item);
		}
		else {
			items.push(astToAjvSchema(item, params));
		}
	};

	let isEnum = true;

	const checkIsEnum = function (item) {
		if (!t.isStringLiteral(item) && !isNumber(item)) {
			isEnum = false;
			return false;
		}
	};

	let isIfThen = true;

	const checkIsIfThen = function (item) {
		if (!isRightShiftWithObjects(item)) {
			isIfThen = false;
			return false;
		}
	};

	traverse(root, checkIsIfThen);

	if (isIfThen && root.operator === '||') {
		return astOrWithRightShiftToAjvSchema(root, params);
	}

	traverse(root, checkIsEnum);
	traverse(root, add);

	const first = items[0];

	if (isEnum) {
		if (root.operator !== '||') {
			throw new Error(`Invalid operator for enum: ${root.operator}`);
		}

		const strings = [];
		const numbers = [];

		for (const item of items) {
			if (isNumber(item)) {
				numbers.push(item);
			}
			else {
				strings.push(item);
			}
		}

		if (strings.length > 0 && numbers.length > 0) {
			const anyOf = cloneDeep(astAnyOf);
			const $strEnum = cloneDeep(astEnum);
			const $numEnum = cloneDeep(astEnum);

			getProp($strEnum, 'enum').value.elements = strings;
			getProp($numEnum, 'enum').value.elements = numbers;
			getProp($numEnum, 'type').value.value = "number";

			getProp(anyOf, 'anyOf').value.elements = (
				strings.includes(first) ?
					[$strEnum, $numEnum] :
					[$numEnum, $strEnum]
			);

			return anyOf;
		}

		const $enum = cloneDeep(astEnum);
		getProp($enum, 'enum').value.elements = items;

		if (isNumber(first)) {
			getProp($enum, 'type').value.value = "number";
		}

		return $enum;
	}

	if (root.operator === '||') {
		const anyOf = cloneDeep(astAnyOf);
		getProp(anyOf, 'anyOf').value.elements = items;
		return anyOf;
	}
	else {
		const allOf = cloneDeep(astAllOf);
		getProp(allOf, 'allOf').value.elements = items;
		return allOf;
	}
}

function astValueLiteralToAjvSchema(root) {
	const $const = cloneDeep(astConst);

	getProp($const, 'const').value = cloneDeep(root);

	return $const;
}

function astRegexToAjvSchema(root) {
	const regexp = cloneDeep(astRegexp);

	getProp(regexp, 'pattern').value = t.stringLiteral(root.pattern);

	return regexp;
}

function astCallExpToAjvSchema(root, params) {
	const {methods, functions} = params;

	if (t.isIdentifier(root.callee)) {
		let func = functions && functions[root.callee.name];

		if (!func) {
			throw new Error(`Unknown function: ${root.callee.name}`);
		}

		return func(root.arguments, params);
	}

	if (!t.isMemberExpression(root.callee)) {
		throw new Error(`Invalid call expression: ${root.callee.type}`);
	}

	const {object, property} = root.callee;
	var schema = astToAjvSchema(object, params);
	const {name} = property;
	const method = methods[name];

	if (!method) {
		throw new Error(`Unknown schema method: ${name}`);
	}

	schema = method(schema, root.arguments, params);

	if (!schema) {
		throw new Error(`Method ${JSON.stringify(name)} must return schema`);
	}

	if (schema.properties) {
		removeProp(schema, 'title');
		removeProp(schema, 'description');
	}

	return schema;
}

function astArrowFunctionToAjvSchema(root, params) {
	if (root.params.length === 1) {
		return astAssignToAjvSchema(
			t.assignmentExpression('=', root.params[0], root.body),
			params
		);
	}
	else {
		return astToAjvSchema(root.body, params);
	}
}

function astUnaryToAjvSchema(root, params) {
	if (isDoubleExclamation(root)) {
		root = root.argument.argument;

		if (t.isObjectExpression(root)) {
			replaceIdentifiers(root, params);
			return root;
		}
		else if (t.isArrayExpression(root)) {
			return astArrayToAjvSchema(root, params, true);
		}
		else {
			throw new Error(`Unknown argument type for "!!" operator: ${JSON.stringify(root.type)}`);
		}
	}
	else {
		throw new Error(`Unknown operator "!"`);
	}
}

function astRightShiftToAjvSchema({left, right}, params) {
	const ifThen = t.objectExpression([]);

	const _if = astToAjvSchema(cloneDeep(left), params);
	getProp(_if, 'additionalProperties').value.value = true;

	let _then = t.objectExpression([
		t.spreadElement(left),
		t.spreadElement(right),
	]);

	_then = astToAjvSchema(_then, params);

	addProp(ifThen, 'if', _if);
	addProp(ifThen, 'then', _then);

	return ifThen;
}

function astOrWithRightShiftToAjvSchema(root, params) {
	const items = [];

	const add = function ({left, right}) {
		if (t.isLogicalExpression(left)) {
			add(left);
		}
		else {
			items.push(left);
		}

		if (t.isLogicalExpression(right)) {
			add(right);
		}
		else {
			items.push(right);
		}
	};

	add(root);

	const ifs = [];
	let topIfThen = null;
	let parentIfThen;

	for (const item of items) {
		const ifThen = astRightShiftToAjvSchema(item, params);

		ifs.push(getProp(ifThen, 'if').value);

		if (!topIfThen) {
			topIfThen = ifThen;
		}

		if (parentIfThen) {
			addProp(parentIfThen, 'else', ifThen);
		}

		parentIfThen = ifThen;
	}

	const oneOf = toAst({oneOf: []});
	oneOf.properties[0].value.elements = ifs;
	addProp(parentIfThen, 'else', oneOf);

	return topIfThen;
}

function astBetweenExpressionToAjvSchema(root, params) {
	const {left, right} = root;
	const x = left.right;

	let schema = astToAjvSchema(x, params);

	schema = set(schema, [left.operator === '<=' ? 'minimum' : 'exclusiveMinimum', left.left], params);
	schema = set(schema, [root.operator === '<=' ? 'maximum' : 'exclusiveMaximum', right], params);

	return schema;
}

function astNumberRangeExpressionToAjvSchema(root, params) {
	const {left, operator, right} = root;

	const schema = astToAjvSchema(left, params);

	return (
		set(schema, [
			operator === '<' ?
				'exclusiveMaximum' :
			operator === '<=' ?
				'maximum' :
			operator === '>' ?
				'exclusiveMinimum' :
				'minimum'
			, right], params)
	);

}

function addDescription(root, target) {
	const comments = (
		Array.isArray(root) ?
			root :
		root.type === 'CommentLine' ?
			[root]:
			(root.leadingComments || root.trailingComments)
	);

	if (!comments || comments.length === 0 || getProp(target, 'description')) {
		return;
	}

	prependProp(
		target,
		t.objectProperty(
			t.identifier('description'),
			t.stringLiteral(
				comments.map(c => c.value.trim()).join('\n')
			)
		)
	);
}

function replaceIdentifiers(root, params) {
	if (t.isObjectExpression(root)) {
		for (const prop of root.properties) {
			if (isObjectName(prop.value)) {
				prop.value = astObjectNameToAjvSchema(prop.value, params);
			}
			else {
				replaceIdentifiers(prop.value, params);
			}
		}
	}

	return root;
}

function replaceObjectKeysWithString(root) {
	if (t.isObjectExpression(root)) {
		for (let prop of root.properties) {
			let {key} = prop;

			if (t.isIdentifier(key)) {
				prop.key = t.stringLiteral(key.name);
			}
			else if (!t.isStringLiteral(key)) {
				throw new Error(`Unknown object property key type: ${key.type}`);
			}
			else {
				delete key.extra;
			}

			replaceObjectKeysWithString(prop.value);
		}
	}
	else if (t.isArrayExpression(root)) {
		root.elements.forEach(replaceObjectKeysWithString);
	}
	else if (t.isStringLiteral(root) && root.extra) {
		delete root.extra; // replace single comma to double
	}

	return root;
}

function replaceComments(root) {
	root.innerComments = root.leadingComments = root.trailingComments = undefined;

	if (t.isObjectExpression(root)) {
		root.properties.forEach(replaceComments);
	}
	else if (t.isArrayExpression(root)) {
		root.elements.forEach(replaceComments);
	}
	else if (t.isObjectProperty(root)) {
		root.innerComments = root.leadingComments = root.trailingComments = undefined;

		replaceComments(root.value);
	}

	return root;
}

function getSchemaName(root) {
	if (!t.isAssignmentExpression(root)) return;

	const {left, operator} = root;

	if (operator !== '=') {
		throw new Error(`Invalid assign operator: ${JSON.stringify(operator)}`);
	}

	return getObjectName(left);
}

function addSchemaName(root, name) {
	if (!name || !root.properties || defaultSchemasNames.includes(name)) return;

	replaceProp(
		root,
		t.objectProperty(
			t.stringLiteral('title'),
			t.stringLiteral(name)
		)
	);
}

function isObjectName(root) {
	return t.isIdentifier(root) || t.isMemberExpression(root) || t.isBinaryExpression(root);
}

function isRightShiftWithObjects(root) {
	return (
		t.isBinaryExpression(root) &&
		root.operator === '>>'
	);
}

function isDoubleExclamation(node) {
	return (
		t.isUnaryExpression(node) &&
		node.operator === '!' &&
		t.isUnaryExpression(node.argument) &&
		node.argument.operator === '!'
	);
}

function isNumber(node) {
	return (
		t.isNumericLiteral(node) ||
		(
			t.isUnaryExpression(node) &&
			node.operator === '-' &&
			t.isNumericLiteral(node.argument)
		)
	);
}

function isBetweenExpression(root) {
	return (
		t.isBinaryExpression(root) &&
		(
			root.operator === '<' ||
			root.operator === '<='
		) &&
		t.isBinaryExpression(root.left) &&
		(
			root.left.operator === '<' ||
			root.left.operator === '<='
		) &&
		isNumber(root.right) &&
		isNumber(root.left.left)
	);
}

function isNumberRangeExpression(root) {
	return (
		t.isBinaryExpression(root) &&
		/^[<>]=?$/.test(root.operator) &&
		isNumber(root.right)
	);
}