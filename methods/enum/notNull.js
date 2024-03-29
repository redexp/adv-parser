const {method, isEnum} = require('../utils');
const {getPropValue, getPropStringValue} = require('../../lib/object');

module.exports = function notNull(schema) {
	method('notNull');
	isEnum(schema);

	const arr = getPropValue(schema, 'anyOf') || getPropValue(schema, 'allOf');

	return arr.elements.find(node => getPropStringValue(node, 'type') !== 'null');
};