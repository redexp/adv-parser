const cloneDeep = require('lodash.clonedeep');
const {method, oneArg, firstString} = require('./utils');
const {getPropValue} = require('../lib/object');
const RuntimeError = require('../lib/RuntimeError');

module.exports = function get(schema, args, {clone = true} = {}) {
	method('get');
	oneArg(args, schema);
	firstString(args[0]);

	var name = args[0].value;

	var prop = getPropValue(schema, name);

	if (!prop) {
		throw new RuntimeError(schema, `Option ${JSON.stringify(name)} is undefined`);
	}

	if (clone) {
		prop = cloneDeep(prop);
	}

	return prop;
};