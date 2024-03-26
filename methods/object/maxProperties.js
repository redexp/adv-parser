const {method, isObject, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function maxProperties(schema, args, params = {}) {
	const methodName = 'maxProperties';
	method(methodName);
	isObject(schema);
	oneArg(args, schema);

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