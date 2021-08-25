module.exports = {
	type: "string",
	pattern: "^\\d{4}-[01]\\d-[0-3]\\d[tT\\s](?:[0-2]\\d:[0-5]\\d:[0-5]\\d|23:59:60)(?:\\.\\d+)?(?:[zZ]|[+-]\\d{2}(?::?\\d{2})?)$",
};