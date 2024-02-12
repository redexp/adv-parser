const {asPure} = require('../lib/object');
const toAst = require('../lib/toAst');

/**
 * @type {import('../index').Schemas}
 */
const schemas = {};

for (const [name, value] of [
	['null', require('./null')],
	['object', require('./object')],
	['array', require('./array')],
	['string', require('./string')],
	['number', require('./number')],
	['int', require('./int')],
	['uint', require('./uint')],
	['positive', require('./positive')],
	['negative', require('./negative')],
	['id', require('./id')],
	['boolean', require('./boolean')],
	['date', require('./date')],
	['time', require('./time')],
	['uri', require('./uri')],
	['email', require('./email')],
	['hostname', require('./hostname')],
	['filename', require('./filename')],
	['ipv4', require('./ipv4')],
	['ipv6', require('./ipv6')],
	['regex', require('./regex')],
	['uuid', require('./uuid')],
	['date-time', require('./date-time')],
	['date-time-tz', require('./date-time-tz')],
	['uri-reference', require('./uri-reference')],
	['uri-template', require('./uri-template')],
]) {
	schemas[name] = asPure(toAst(value));
}

for (const [alias, name] of [
	['date_time', 'date-time'],
	['datetime', 'date-time'],
	['dateTime', 'date-time'],
	['date_time_tz', 'date-time-tz'],
	['datetimetz', 'date-time-tz'],
	['dateTimeTz', 'date-time-tz'],
	['dateTimeTZ', 'date-time-tz'],
	['uri_reference', 'uri-reference'],
	['uriReference', 'uri-reference'],
	['uri_template', 'uri-template'],
	['uriTemplate', 'uri-template'],
]) {
	schemas[alias] = schemas[name];
}

module.exports = schemas;