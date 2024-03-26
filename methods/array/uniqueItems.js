const {method, isArray, oneArg, firstBoolean} = require('../utils');
const set = require('../set');

module.exports = function uniqueItems(schema, args, params = {}) {
	const methodName = 'uniqueItems';
	method(methodName);
	isArray(schema);
	oneArg(args, schema);

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			valueType: firstBoolean,
			...params,
		}
	);
};