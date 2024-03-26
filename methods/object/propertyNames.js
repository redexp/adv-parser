const {method, isObject, oneArg, firstObject} = require('../utils');
const set = require('../set');

module.exports = function propertyNames(schema, args, params = {}) {
	const methodName = 'propertyNames';
	method(methodName);
	isObject(schema);
	oneArg(args, schema);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			convertValue: true,
			valueType: firstObject,
			...params,
		}
	);
};