const {convertProperties} = require('./patternProperties');
const {method, isObject, oneArg, firstObject} = require('../utils');
const set = require('../set');

module.exports = function dependentSchemas(schema, args, params = {}) {
	const methodName = 'dependentSchemas';
	method(methodName);
	isObject(schema);
	oneArg(args, schema);

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