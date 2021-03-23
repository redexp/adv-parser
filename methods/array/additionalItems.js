const {method, isArray, oneArg, firstBoolean} = require('../utils');
const set = require('../set');

module.exports = function additionalItems(schema, args, params = {}) {
	const methodName = 'additionalItems';
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