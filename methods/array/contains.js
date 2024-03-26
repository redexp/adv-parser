const {method, isArray, oneArg} = require('../utils');
const set = require('../set');

module.exports = function contains(schema, args, params = {}) {
	const methodName = 'contains';
	method(methodName);
	isArray(schema);
	oneArg(args, schema);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			convertValue: true,
			...params,
		}
	);
};