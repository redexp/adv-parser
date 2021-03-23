const merge = require('./merge');
const add = (target, schemas) => merge(target, schemas, {methodName: 'add'});
const assign = (target, schemas) => merge(target, schemas, {methodName: 'assign'});
const extend = (target, schemas) => merge(target, schemas, {methodName: 'extend'});
const get = require('./get');
const set = require('./set');
const not = require('./not');

const minLength = require('./string/minLength');
const maxLength = require('./string/maxLength');
const pattern = require('./string/pattern');
const format = require('./string/format');

const minimum = require('./number/minimum');
const maximum = require('./number/maximum');
const exclusiveMinimum = require('./number/exclusiveMinimum');
const exclusiveMaximum = require('./number/exclusiveMaximum');
const multipleOf = require('./number/multipleOf');

const items = require('./array/items');
const minItems = require('./array/minItems');
const maxItems = require('./array/maxItems');
const uniqueItems = require('./array/uniqueItems');
const additionalItems = require('./array/additionalItems');
const contains = require('./array/contains');
const minContains = require('./array/minContains');
const maxContains = require('./array/maxContains');
const unevaluatedItems = require('./array/unevaluatedItems');

const prop = require('./object/prop');
const props = require('./object/props');
const pick = (schema, args) => props(schema, args, {methodName: 'pick'});
const remove = require('./object/remove');
const omit = (schema, args) => remove(schema, args, {methodName: 'omit'});
const required = require('./object/required');
const notRequired = require('./object/notRequired');
const optional = (schema, args) => notRequired(schema, args, {methodName: 'optional'});
const additionalProperties = require('./object/additionalProperties');
const dependencies = require('./object/dependencies');
const dependentRequired = require('./object/dependentRequired');
const dependentSchemas = require('./object/dependentSchemas');
const maxProperties = require('./object/maxProperties');
const minProperties = require('./object/minProperties');
const patternProperties = require('./object/patternProperties');
const propertyNames = require('./object/propertyNames');
const unevaluatedProperties = require('./object/unevaluatedProperties');

module.exports = {
	merge,
	add,
	assign,
	extend,
	get,
	set,
	not,

	minLength,
	maxLength,
	pattern,
	format,

	maximum,
	minimum,
	exclusiveMinimum,
	exclusiveMaximum,
	multipleOf,

	items,
	minItems,
	maxItems,
	uniqueItems,
	additionalItems,
	contains,
	minContains,
	maxContains,
	unevaluatedItems,

	prop,
	props,
	pick,
	remove,
	omit,
	required,
	notRequired,
	optional,
	additionalProperties,
	dependencies,
	dependentRequired,
	dependentSchemas,
	maxProperties,
	minProperties,
	patternProperties,
	propertyNames,
	unevaluatedProperties,
};