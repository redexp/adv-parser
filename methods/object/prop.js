const cloneDeep = require('lodash.clonedeep');
const {method, isObject, oneArg, firstString} = require('../utils');
const {getPropValue} = require('../../lib/object');
const AdvSyntaxError = require('../../lib/AdvSyntaxError');
const AdvReferenceError = require('../../lib/AdvReferenceError');

module.exports = function prop(schema, args, {clone = true} = {}) {
	method('prop');
	isObject(schema);
	oneArg(args, schema);
	firstString(args[0]);

	var props = getPropValue(schema, 'properties');

	if (!props) {
		throw new AdvSyntaxError(schema, 'Invalid "object" schema, "properties" undefined');
	}

	var name = args[0].value;

	var prop = getPropValue(props, name);

	if (!prop) {
		throw new AdvReferenceError(name, schema, `Property ${JSON.stringify(name)} is undefined`);
	}

	if (clone) {
		prop = cloneDeep(prop);
	}

	return prop;
};