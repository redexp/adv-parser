const t = require('@babel/types');
const cloneDeep = require('lodash.clonedeep');
const {method, isObject, atLeastOne, onlyStrings} = require('../utils');
const set = require('../set');
const {getProp, replaceProp} = require('../../lib/object');
const {push, remove} = require('../../lib/array');

module.exports = function required(schema, args, {methodName = 'required', add = true, clone = true} = {}) {
	method(methodName);
	isObject(schema);
	atLeastOne(args);

	if (args.length === 1 && !t.isStringLiteral(args[0])) {
		let valueType = value => {
			if (!t.isArrayExpression(value)) {
				throw new Error(`Method "${methodName}" required array`);
			}

			for (const item of value.elements) {
				if (!t.isStringLiteral(item)) {
					throw new Error(`Method "${methodName}" required array of strings`);
				}
			}
		}

		return set(schema, ['required', args[0]], {methodName, valueType, clone});
	}

	onlyStrings(args);

	args = args.map(s => s.value);

	var required = getProp(schema, 'required');

	if (clone) {
		schema = cloneDeep(schema);
	}

	required = required ? required.value.elements.map(s => s.value) : [];

	for (const name of args) {
		if (add) {
			push(required, name);
		}
		else {
			remove(required, name);
		}
	}

	replaceProp(
		schema,
		t.objectProperty(
			t.stringLiteral('required'),
			t.arrayExpression(required.map(s => t.stringLiteral(s)))
		)
	);

	return schema;
};