const {method, isString, oneArg, firstString} = require('../utils');
const set = require('../set');

module.exports = function pattern(schema, args, params = {}) {
	const methodName = 'pattern';
	method(methodName);
	isString(schema);
	oneArg(args);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			valueType: firstString,
			...params,
		}
	);
};