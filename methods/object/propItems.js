const t = require('@babel/types');
const prop = require('./prop');
const get = require('../get');

module.exports = function (schema, args, params) {
	const p = prop(schema, args, params);
	return get(p, [t.stringLiteral('items')], params);
};