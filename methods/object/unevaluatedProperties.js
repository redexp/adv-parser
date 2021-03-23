const {method, isObject, oneArg, firstBoolean} = require('../utils');
const set = require('../set');

module.exports = function unevaluatedProperties(schema, args, params = {}) {
	const methodName = 'unevaluatedProperties';
	method(methodName);
	isObject(schema);
	oneArg(args);

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