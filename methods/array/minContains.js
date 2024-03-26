const {method, isArray, oneArg, firstNumber} = require('../utils');
const set = require('../set');

module.exports = function minContains(schema, args, params = {}) {
	const methodName = 'minContains';
	method(methodName);
	isArray(schema);
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