const {method, isString, oneArg, firstString} = require('../utils');
const set = require('../set');

module.exports = function format(schema, args, params = {}) {
	const methodName = 'format';
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