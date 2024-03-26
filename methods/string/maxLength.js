const {method, isString, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function maxLength(schema, args, params = {}) {
	const methodName = 'maxLength';
	method(methodName);
	isString(schema);
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