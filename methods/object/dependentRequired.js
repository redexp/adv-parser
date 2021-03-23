const {method, isObject, oneArg, firstObject} = require('../utils');
const set = require('../set');

module.exports = function dependentRequired(schema, args, {methodName = 'dependentRequired', ...params} = {}) {
	method(methodName);
	isObject(schema);
	oneArg(args);

	return set(
		schema,
		['dependentRequired', args[0]],
		{
			methodName,
			valueType: firstObject,
			...params,
		}
	);
};