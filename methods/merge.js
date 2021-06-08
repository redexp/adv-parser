const t = require('@babel/types');
const cloneDeep = require('lodash.clonedeep');
const indexBy = require('lodash.keyby');
const {method, atLeastOne} = require('./utils');
const {getProp, getPropStringValue, getPropName, replaceProp} = require('../lib/object');
const {push, remove} = require('../lib/array');

module.exports = function merge(target, schemas, params = {}) {
	const {methodName = 'merge', clone = true} = params;
	method(methodName);
	atLeastOne(schemas);

	const {astToAjvSchema} = require('../index');

	var mainType = getPropStringValue(target, 'type');
	var isObject = mainType === 'object';
	var required = getProp(target, 'required');
	var properties = getProp(target, 'properties');

	if (clone) {
		target = {...target};
		target.properties = target.properties.map(function (prop) {
			if (prop === required || prop === properties) return prop;

			return cloneDeep(prop);
		});
	}

	if (isObject) {
		required = required ? required.value.elements.map(s => s.value) : [];
		properties = properties ? indexBy(properties.value.properties, getPropName) : {};
	}

	schemas.forEach(function (schema) {
		schema = astToAjvSchema(schema, params);

		var type = getPropStringValue(schema, 'type');

		if (type !== mainType) {
			throw new Error(`You can extend only same type schemas: ${mainType} and ${type}`);
		}

		if (isObject) {
			let req = getProp(schema, 'required');
			let props = getProp(schema, 'properties');

			req = req ? indexBy(req.value.elements, s => s.value) : {};
			props = props ? props.value.properties : [];

			props.forEach(function (prop) {
				var {value} = prop;
				var name = getPropName(prop);

				if (t.isIdentifier(value) && value.name === 'undefined') {
					remove(required, name);
					delete properties[name];
					return;
				}

				if (req.hasOwnProperty(name)) {
					push(required, name);
				}
				else if (required.includes(name)) {
					remove(required, name);
				}

				properties[name] = prop;
			});
		}

		schema.properties.forEach(function (prop) {
			var name = getPropName(prop);

			if (
				name === 'title' ||
				(
					isObject &&
					(name === 'required' || name === 'properties')
				)
			) {
				return;
			}

			replaceProp(target, prop);
		});
	});

	if (isObject) {
		replaceProp(
			target,
			t.objectProperty(
				t.stringLiteral('required'),
				t.arrayExpression(required.map(s => t.stringLiteral(s)))
			)
		);

		replaceProp(
			target,
			t.objectProperty(
				t.stringLiteral('properties'),
				t.objectExpression(Object.values(properties))
			)
		);
	}

	return target;
};