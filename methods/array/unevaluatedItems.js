const {method, isArray, oneArg, firstBoolean} = require('../utils');
const set = require('../set');

module.exports = function unevaluatedItems(schema, args, params = {}) {
	const methodName = 'unevaluatedItems';
	method(methodName);
	isArray(schema);
	oneArg(args);

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