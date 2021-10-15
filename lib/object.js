const t = require('@babel/types');

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
		throw new Error(`Invalid argument type: ${JSON.stringify(root && root.type)}, ObjectExpression expected`);
	}

	return t.unaryExpression('!', t.unaryExpression('!', root));
}

function getProp(obj, name) {
	if (!Array.isArray(obj.properties)) {
		throw new Error(`Invalid object without properties: ${obj.type}`);
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
		throw new Error(`Invalid object key type: ${key.type}`);
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
		throw new Error(`Invalid property value type ${value.type}, expected String`);
	}

	return value.value;
}

function addProp(obj, name, value) {
	if (!t.isObjectExpression(obj)) {
		throw new Error(`Invalid object type: ${obj.type}`);
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
		throw new Error(`Invalid object type: ${obj.type}`);
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