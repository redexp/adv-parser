const toAst = require('../lib/toAst');
const dt = require('./date-time');
const dtt = require('./date-time-tz');
const ur = require('./uri-reference');
const ut = require('./uri-template');

var schemas = {
	null: require('./null'),
	object: require('./object'),
	array: require('./array'),
	string: require('./string'),
	number: require('./number'),
	int: require('./int'),
	positive: require('./positive'),
	negative: require('./negative'),
	id: require('./id'),
	boolean: require('./boolean'),
	date: require('./date'),
	time: require('./time'),
	"date-time": dt,
	date_time: dt,
	datetime: dt,
	dateTime: dt,
	"date-time-tz": dtt,
	date_time_tz: dtt,
	datetimetz: dtt,
	dateTimeTz: dtt,
	dateTimeTZ: dtt,
	uri: require('./uri'),
	"uri-reference": ur,
	uri_reference: ur,
	uriReference: ur,
	"uri-template": ut,
	uri_template: ut,
	uriTemplate: ut,
	email: require('./email'),
	hostname: require('./hostname'),
	filename: require('./filename'),
	ipv4: require('./ipv4'),
	ipv6: require('./ipv6'),
	regex: require('./regex'),
	uuid: require('./uuid'),
};

for (var name in schemas) {
	schemas[name] = toAst(schemas[name]);
}

module.exports = schemas;