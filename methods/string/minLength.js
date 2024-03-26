const {method, isString, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function minLength(schema, args, params = {}) {
	const methodName = 'minLength';
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