const required = require('./required');
const {method, isObject, atLeastOne, onlyStrings} = require('../utils');

module.exports = function notRequired(schema, args, {methodName = 'notRequired', ...params} = {}) {
	method(methodName);
	isObject(schema);
	atLeastOne(args);
	onlyStrings(args);

	return required(schema, args, {methodName, add: false, ...params});
};