const merge = require('./merge');
const add = (target, schemas, params = {}) => merge(target, schemas, {methodName: 'add', ...params});
const assign = (target, schemas, params = {}) => merge(target, schemas, {methodName: 'assign', ...params});
const extend = (target, schemas, params = {}) => merge(target, schemas, {methodName: 'extend', ...params});
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
const propItems = require('./object/propItems');
const pick = (schema, args, params = {}) => props(schema, args, {methodName: 'pick', ...params});
const remove = require('./object/remove');
const omit = (schema, args, params = {}) => remove(schema, args, {methodName: 'omit', ...params});
const required = require('./object/required');
const notRequired = require('./object/notRequired');
const optional = (schema, args, params = {}) => notRequired(schema, args, {methodName: 'optional', ...params});
const additionalProperties = require('./object/additionalProperties');
const dependencies = require('./object/dependencies');
const dependentRequired = require('./object/dependentRequired');
const dependentSchemas = require('./object/dependentSchemas');
const maxProperties = require('./object/maxProperties');
const minProperties = require('./object/minProperties');
const patternProperties = require('./object/patternProperties');
const propertyNames = require('./object/propertyNames');
const unevaluatedProperties = require('./object/unevaluatedProperties');
const id = require('./object/id');
const ref = require('./object/ref');
const notNull = require('./enum/notNull');

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
	propItems,
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
	id,
	ref,

	notNull,
};