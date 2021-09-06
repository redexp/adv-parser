const {method, oneArg, firstString} = require('../utils');
const set = require('../set');

module.exports = function id(schema, args, params = {}) {
	const methodName = 'id';
	method(methodName);
	oneArg(args);

	return set(
		schema,
		['$' + methodName, args[0]],
		{
			methodName,
			valueType: firstString,
			...params,
		}
	);
};