const cloneDeep = require('lodash.clonedeep');
const t = require('@babel/types');
const {method, isObject, atLeastOne} = require('../utils');
const {getProp, getPropName, replaceProp} = require('../../lib/object');
const RuntimeError = require('../../lib/RuntimeError');

module.exports = function props(schema, args, {methodName = 'props'} = {}) {
	method(methodName);
	isObject(schema);
	atLeastOne(args, schema);

	const errMessage = `Method ${JSON.stringify(methodName)} accept only strings, key/string objects or array of strings`;

	const map = new Map();

	for (const prop of flatten(args)) {
		if (t.isStringLiteral(prop)) {
			map.set(prop.value, prop.value);
		}
		else if (t.isObjectExpression(prop)) {
			for (const item of prop.properties) {
				if (!t.isStringLiteral(item.value)) {
					throw new RuntimeError(item, errMessage);
				}

				map.set(item.key.name || item.key.value, item.value.value);
			}
		}
		else {
			throw new RuntimeError(schema, errMessage);
		}
	}

	var required = getProp(schema, 'required');
	var properties = getProp(schema, 'properties');

	schema = {...schema};
	schema.properties = schema.properties.map(function (prop) {
		if (prop === required || prop === properties) return prop;

		return cloneDeep(prop);
	});

	if (required) {
		const props = [];

		for (const prop of required.value.elements) {
			const name = prop.value;

			if (!map.has(name)) continue;

			props.push(t.stringLiteral(map.get(name)));
		}

		replaceProp(schema, {
			...required,
			value: t.arrayExpression(props),
		});
	}

	if (properties) {
		const props = [];

		for (let prop of properties.value.properties) {
			const name = getPropName(prop);

			if (!map.has(name)) continue;

			const alias = map.get(name);

			if (name !== alias) {
				prop = {
					...prop,
					key: t.stringLiteral(alias),
				};
			}

			props.push(prop);
		}

		replaceProp(schema, {
			...properties,
			value: t.objectExpression(props),
		});
	}

	return schema;
};

function flatten(args) {
	const arr = [];

	for (const item of args) {
		if (t.isArrayExpression(item)) {
			for (const element of item.elements) {
				arr.push(element);
			}
		}
		else {
			arr.push(item);
		}
	}

	return arr;
}