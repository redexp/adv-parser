const {method, isObject, oneArg, firstBoolean} = require('../utils');
const set = require('../set');

module.exports = function additionalProperties(schema, args, params = {}) {
	const methodName = 'additionalProperties';
	method(methodName);
	isObject(schema);
	oneArg(args, schema);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			valueType: firstBoolean,
			...params,
		}
	);
};