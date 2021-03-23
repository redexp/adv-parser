const {method, isObject, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function minProperties(schema, args, params = {}) {
	const methodName = 'minProperties';
	method(methodName);
	isObject(schema);
	oneArg(args);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			valueType: firstNumber,
			...params,
		}
	);
};