const additionalProperties = require('./additionalProperties');
const dependencies = require('./dependencies');
const dependentRequired = require('./dependentRequired');
const dependentSchemas = require('./dependentSchemas');
const maxProperties = require('./maxProperties');
const minProperties = require('./minProperties');
const patternProperties = require('./patternProperties');
const propertyNames = require('./propertyNames');
const required = require('./required');
const unevaluatedProperties = require('./unevaluatedProperties');

module.exports = {
	additionalProperties,
	dependencies,
	dependentRequired,
	dependentSchemas,
	maxProperties,
	minProperties,
	patternProperties,
	propertyNames,
	required,
	unevaluatedProperties,
};