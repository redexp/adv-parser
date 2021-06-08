const t = require('@babel/types');
const {method, getMethodName, isObject, oneArg, firstObject} = require('../utils');
const set = require('../set');

module.exports = function patternProperties(schema, args, params = {}) {
	const methodName = 'patternProperties';
	method(methodName);
	isObject(schema);
	oneArg(args);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			convertValue: convertProperties,
			valueType: firstObject,
			...params,
		}
	);
};

module.exports.convertProperties = convertProperties;

function convertProperties(value, params) {
	const {astToAjvSchema} = require('../../index');

	if (t.isCallExpression(value)) {
		value = astToAjvSchema(value);
		firstObject(value);
		return value;
	}

	firstObject(value);

	value = {...value};
	value.properties = value.properties.map(function (prop) {
		if (!t.isObjectProperty(prop)) {
			throw new Error(`Method "${getMethodName()}" invalid object property type: ${prop.type}`);
		}

		prop = {...prop};

		prop.value = astToAjvSchema(prop.value, params);

		return prop;
	});

	return value;
}