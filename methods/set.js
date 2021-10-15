const t = require('@babel/types');
const cloneDeep = require('lodash.clonedeep');
const {getPropName, replaceProp} = require('../lib/object');
const {method, objectOrTwo} = require('./utils');
const {astToAjvSchema} = require("../index");

module.exports = function set(schema, args, params = {}) {
	const {methodName = 'set', clone = true, convertValue = false, valueType} = params;

	method(methodName);
	objectOrTwo(args);

	var [first, second] = args;

	if (args.length === 1) {
		args = first.properties.map(prop => [getPropName(prop), prop.value]);
	}
	else {
		if (t.isStringLiteral(first)) {
			first = first.value;
		}

		args = [[first, second]];
	}

	const {astToAjvSchema} = require('../index');

	if (clone) {
		schema = cloneDeep(schema);
	}

	for (let [name, value] of args) {
		if (convertValue || t.isCallExpression(value)) {
			if (typeof convertValue === 'function') {
				value = convertValue(value, params);
			}
			else {
				value = astToAjvSchema(value, params);
			}
		}

		if (valueType) {
			valueType(value);
		}

		replaceProp(
			schema,
			t.objectProperty(
				t.stringLiteral(name),
				value
			)
		);
	}

	return schema;
};