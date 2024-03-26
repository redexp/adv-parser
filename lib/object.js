const t = require('@babel/types');
const AdvSyntaxError = require('./AdvSyntaxError');

module.exports = {
	isPure,
	asPure,
	getProp,
	getPropValue,
	getPropStringValue,
	getPropName,
	addProp,
	prependProp,
	removeProp,
	replaceProp,
};

function isPure(root) {
	return (
		t.isUnaryExpression(root) &&
		root.operator === '!' &&
		t.isUnaryExpression(root.argument) &&
		root.argument.operator === '!' &&
		t.isObjectExpression(root.argument.argument)
	);
}

function asPure(root) {
	if (!t.isObjectExpression(root)) {
		root = root || {};
		throw new AdvSyntaxError(root, `Invalid argument type of !! operator: ${JSON.stringify(root.type)}, ObjectExpression expected`);
	}

	return t.unaryExpression('!', t.unaryExpression('!', root));
}

function getProp(obj, name) {
	if (!Array.isArray(obj.properties)) {
		throw new AdvSyntaxError(obj, `Invalid object without properties: ${obj.type}`);
	}

	return obj.properties.find(function (prop) {
		return t.isObjectProperty(prop) && getPropName(prop) === name;
	});
}

function getPropName(prop) {
	var {key} = prop;

	if (t.isIdentifier(key)) {
		return key.name;
	}
	else if (t.isStringLiteral(key)) {
		return key.value;
	}
	else if (t.isRegExpLiteral(key)) {
		return key.pattern;
	}
	else {
		throw new AdvSyntaxError(prop, `Invalid object key type: ${JSON.stringify(key.type)}`);
	}
}

function getPropValue(obj, name) {
	var prop = getProp(obj, name);

	return prop && prop.value;
}

function getPropStringValue(obj, name) {
	var value = getPropValue(obj, name);

	if (!value) return value;

	if (!t.isStringLiteral(value)) {
		throw new AdvSyntaxError(value, `Invalid property value type ${JSON.stringify(value.type)}, expected String`);
	}

	return value.value;
}

function addProp(obj, name, value) {
	if (!t.isObjectExpression(obj)) {
		throw new AdvSyntaxError(obj, `Invalid object type: ${obj.type}`);
	}

	obj.properties.push(
		t.objectProperty(
			t.stringLiteral(name),
			value
		)
	);
}

function prependProp(obj, prop) {
	if (!t.isObjectExpression(obj)) {
		throw new AdvSyntaxError(obj, `Invalid object type: ${obj.type}`);
	}

	removeProp(obj, prop);

	obj.properties.unshift(prop);
}

function removeProp(props, name, newProp = null) {
	if (t.isObjectExpression(props)) {
		props = props.properties;
	}

	if (t.isObjectProperty(name)) {
		name = getPropName(name);
	}

	return props.some(function (prop, i) {
		if (t.isSpreadElement(prop)) return;

		if (getPropName(prop) === name) {
			if (newProp !== null) {
				props.splice(i, 1, newProp);
			}
			else {
				props.splice(i, 1);
			}

			return true;
		}
	});
}

function replaceProp(props, prop) {
	if (t.isObjectExpression(props)) {
		props = props.properties;
	}

	if (!removeProp(props, getPropName(prop), prop)) {
		props.push(prop);
	}
}