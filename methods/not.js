const {method, oneArg, firstObject} = require('./utils');
const set = require('./set');

module.exports = function not(schema, args, params = {}) {
	const methodName = 'not';
	method(methodName);
	oneArg(args);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			valueType: firstObject,
			...params,
		}
	);
};