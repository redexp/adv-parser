const t = require('@babel/types');
const generate = require('@babel/generator').default;
const cloneDeep = require('lodash.clonedeep');
const toAst = require('./lib/toAst');
const getObjectName = require('./lib/getObjectName');
const defaultSchemas = require('./schemas');
const {isPure, getProp, getPropName, prependProp, removeProp, addProp, replaceProp} = require('./lib/object');
const defaultMethods = require('./methods');
const defaultObjectMethods = require('./methods/object');

const defaultSchemasNames = Object.keys(defaultSchemas);

const astObject = toAst(require('./schemas/object'));
const astArray = toAst(require('./schemas/array'));
const astRegexp = toAst(require('./schemas/regexp'));
const astEnum = toAst(require('./schemas/enum'));
const astAnyOf = toAst(require('./schemas/anyOf'));
const astAllOf = toAst(require('./schemas/allOf'));
const astConst = toAst(require('./schemas/const'));

const optionalPropName = /\?$/;
const methodPropName = /^\$/;

module.exports = parseSchema;
module.exports.getAstSchema = getAstSchema;
module.exports.generateAjvSchema = generateAjvSchema;
module.exports.astToAjvSchema = astToAjvSchema;

/**
 * @param {string|function} code
 * @param {{schemas?: Object, methods?: Object<string, function>, functions?: Object<string, function>, objectOptions?: Object<string, function>}} params
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
	arraySyntax = 8
} = {}) {
	var schema = astToAjvSchema(ast, {
		schemas,
		methods,
		functions,
		objectOptions,
		arraySyntax,
	});

	replaceObjectKeysWithString(schema);
	replaceComments(schema);

	return toJsonObject(schema);
}

function getAstSchema(code, {schemas} = {}) {
	var schema = toAst(code);

	if (schemas && t.isAssignmentExpression(schema)) {
		let {left, right} = schema;
		var name = getObjectName(left);

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
	else if (t.isIdentifier(root) || t.isMemberExpression(root) || t.isBinaryExpression(root) || t.isNullLiteral(root)) {
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
	else if (t.isNumericLiteral(root) || t.isStringLiteral(root) || t.isBooleanLiteral(root)) {
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

	schemas[name] = cloneDeep(schema);

	return schema;
}

function astObjectToAjvSchema(root, params) {
	const {objectOptions} = params;
	const pure = isPure(root);

	if (pure && root.properties.every(prop => !t.isSpreadElement(prop) && !isMethodProp(prop, objectOptions))) {
		addDescription(root, root);
		return root;
	}

	const type = pure && getProp(root, 'type');
	const obj = pure ? t.objectExpression(type ? [cloneDeep(type)] : []) : cloneDeep(astObject);
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

			defaultMethods[isPure(src) ? 'set' : 'merge'](obj, [src], {clone: false, ...params});

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

		if (pure) {
			if (optional) {
				throw new Error(`Invalid object key: You can't use "optional" properties in pure ajv validator`);
			}

			props.push(prop);
		}
		else {
			if (optionalPropName.test(name)) {
				name = prop.key.value = name.replace(optionalPropName, '');
				optional = true;
			}

			if (t.isIdentifier(value) && value.name === 'undefined') {
				toggleRequired(name, false);
				removeProp(properties.value, name);
				continue;
			}

			toggleRequired(name, !optional);

			prop.computed = false; // [key]: => key:
			prop.value = astToAjvSchema(value, params);

			addDescription(prop, prop.value);

			replaceProp(properties.value, prop);
		}
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
	var arr = cloneDeep(astArray);
	var {elements} = root;
	const {arraySyntax} = params;
	const v8 = arraySyntax === 8;

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
			v8 ? 'prefixItems' : 'items',
			t.arrayExpression(
				elements
					.filter(el => !t.isSpreadElement(el))
					.map(el => astToAjvSchema(el, params))
			)
		);

		if (spreads.length > 0) {
			addProp(arr, v8 ? 'items' : 'contains', astToAjvSchema(spreads[0].argument, params));
		}

		break;
	}

	return arr;
}

function astEnumToAjvSchema(root, params) {
	var items = [];

	var add = function (node) {
		var {left, right, operator} = node;

		if (operator !== '||' && operator !== '&&') {
			throw new Error(`Invalid enum operator: ${operator}`);
		}

		if (operator !== root.operator) {
			throw new Error(`All operators of enum should be same type: ${root.operator}`);
		}

		var check = function (item) {
			if (t.isStringLiteral(item) || t.isNumericLiteral(item)) {
				items.push(item);
			}
			else if (t.isLogicalExpression(item)) {
				add(item);
			}
			else {
				items.push(astToAjvSchema(item, params));
			}
		};

		check(left);
		check(right);
	};

	add(root);

	var first = items[0];

	if (items.some(item => item.type !== first.type)) {
		throw new Error(`All items of enum should be same type`);
	}

	if (t.isStringLiteral(first) || t.isNumericLiteral(first)) {
		if (root.operator !== '||') {
			throw new Error(`Invalid operator for enum: ${root.operator}`);
		}

		var $enum = cloneDeep(astEnum);
		getProp($enum, 'enum').value.elements = items;

		if (t.isNumericLiteral(first)) {
			getProp($enum, 'type').value.value = "number";
		}

		return $enum;
	}

	if (root.operator === '||') {
		var anyOf = cloneDeep(astAnyOf);
		getProp(anyOf, 'anyOf').value.elements = items;
		return anyOf;
	}
	else {
		var allOf = cloneDeep(astAllOf);
		getProp(allOf, 'allOf').value.elements = items;
		return allOf;
	}
}

function astValueLiteralToAjvSchema(root) {
	var $const = cloneDeep(astConst);

	getProp($const, 'const').value = cloneDeep(root);

	return $const;
}

function astRegexToAjvSchema(root) {
	var regexp = cloneDeep(astRegexp);

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
	if (t.isArrayExpression(root.argument)) {
		return astArrayToAjvSchema(root.argument, params, true);
	}

	return astToAjvSchema(root.argument, params);
}

function addDescription(root, target) {
	let comments = root.leadingComments || root.trailingComments;

	if (comments && comments.length > 0 && !getProp(target, 'description')) {
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

	var {left, operator} = root;

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

function isMethodProp(prop, objectOptions) {
	let name = getPropName(prop);

	return methodPropName.test(name) && objectOptions.hasOwnProperty(name.slice(1));
}