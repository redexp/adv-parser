const {method, isNumber, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function multipleOf(schema, args, params = {}) {
	const methodName = 'multipleOf';
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