const {method, isNumber, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function maximum(schema, args, params = {}) {
	const methodName = 'maximum';
	method(methodName);
	isNumber(schema);
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