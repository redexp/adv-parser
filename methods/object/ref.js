const {method, oneArg, firstString} = require('../utils');
const set = require('../set');

module.exports = function not(schema, args, params = {}) {
	const methodName = 'ref';
	method(methodName);
	oneArg(args, schema);

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