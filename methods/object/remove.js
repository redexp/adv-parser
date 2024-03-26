const cloneDeep = require('lodash.clonedeep');
const {method, isObject, atLeastOne, onlyStrings} = require('../utils');
const {getProp, getPropName, replaceProp} = require('../../lib/object');

module.exports = function remove(schema, args, {methodName = 'remove'} = {}) {
	method(methodName);
	isObject(schema);
	atLeastOne(args, schema);
	onlyStrings(args);

	args = args.map(s => s.value);

	var required = getProp(schema, 'required');
	var properties = getProp(schema, 'properties');

	schema = {...schema};
	schema.properties = schema.properties.map(function (prop) {
		if (prop === required || prop === properties) return prop;

		return cloneDeep(prop);
	});

	if (required) {
		required = {...required};

		required.value.elements = required.value.elements.filter(function (item) {
			return !args.includes(item.value);
		});

		replaceProp(schema, required);
	}

	if (properties) {
		properties = {...properties};

		properties.value.properties = properties.value.properties.filter(function (prop) {
			return !args.includes(getPropName(prop));
		});

		replaceProp(schema, properties);
	}

	return schema;
};