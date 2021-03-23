const dependentRequired = require('./dependentRequired');

module.exports = function dependencies(schema, args, params = {}) {
	return dependentRequired(schema, args, {methodName: 'dependencies', ...params});
};