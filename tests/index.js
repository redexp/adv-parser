// noinspection JSUnusedLocalSymbols

const {expect} = require('chai');
const parser = require("../index");

describe('parseSchema', function () {
	const originParser = require('../index');
	const defaultSchemas = require('../schemas');
	const {getAstSchema, generateAjvSchema} = originParser;
	
	var schemas = {};
	
	const parser = function (code, params = {}) {
		return originParser(code, {schemas, ...params});
	};

	beforeEach(function () {
		schemas = {...defaultSchemas};
	});

	it('json-schema', function () {
		var res = parser(`
			{
				id: number,
				name: string,
				date: date-time,
				[dateTz]: dateTimeTZ,
				regex: /^\\d+$/,
				constNumber: 10,
				constString: "test",
				constBoolean: true,
				[optional]: string,
				listInt: [int],
				listStr: [!!{
					type: 'string'
				}],
				listObj: [{
					type: string
				}],
				listOr: [number || string],
				listTwo: [number, string],
				enumInt: -1 || 2 || 3,
				[enumIntNull]: -1 || 2 || null,
				enumStr: "user" || 'account' || "item",
				[enumIntStr]: "1" || 1 || "2" || 2 || null,
				any_of: number || string || int || null,
				all_of: number && string && int,
				[intBetween]: -1 <= int < 10,
				[intLT]: uint < 10,
				[intInArr]: [uint <= 10],
			}
		`);

		expect(res).to.eql({
			"type": "object",
			"additionalProperties": false,
			"required": ["id", "name", "date", "regex", "constNumber", "constString", "constBoolean", "listInt", "listStr", "listObj", "listOr", "listTwo", "enumInt", "enumStr", "any_of", "all_of"],
			"properties": {
				id: {
					"type": "number"
				},
				name: {
					"type": "string"
				},
				date: {
					"type": "string",
					pattern: "^\\d{4}-[01]\\d-[0-3]\\d[tT\\s](?:[0-2]\\d:[0-5]\\d:[0-5]\\d|23:59:60)(?:\\.\\d+)?(?:[zZ]|[+-]\\d{2}(?::?\\d{2})?)?$",
				},
				dateTz: {
					"type": "string",
					pattern: "^\\d{4}-[01]\\d-[0-3]\\d[tT\\s](?:[0-2]\\d:[0-5]\\d:[0-5]\\d|23:59:60)(?:\\.\\d+)?(?:[zZ]|[+-]\\d{2}(?::?\\d{2})?)$",
				},
				regex: {
					"type": "string",
					pattern: "^\\d+$",
				},
				constNumber: {
					"const": 10
				},
				constString: {
					"const": "test"
				},
				constBoolean: {
					"const": true
				},
				optional: {
					"type": "string"
				},
				listInt: {
					"type": "array",
					"items": {
						"type": "integer"
					}
				},
				listStr: {
					"type": "array",
					"items": {
						type: "string"
					}
				},
				listObj: {
					"type": "array",
					"items": {
						"type": "object",
						"additionalProperties": false,
						"required": ["type"],
						"properties": {
							type: {
								"type": "string"
							}
						}
					}
				},
				listOr: {
					type: 'array',
					items: {
						anyOf: [
							{type: 'number'},
							{type: 'string'},
						]
					}
				},
				listTwo: {
					type: 'array',
					items: [
						{type: 'number'},
						{type: 'string'},
					]
				},
				enumInt: {
					"type": "number",
					"enum": [-1, 2, 3]
				},
				enumIntNull: {
					anyOf: [
						{
							type: "number",
							enum: [-1, 2]
						},
						{
							type: "null"
						}
					]
				},
				enumStr: {
					"type": "string",
					"enum": ["user", "account", "item"]
				},
				enumIntStr: {
					anyOf: [
						{
							type: "string",
							enum: ['1', '2']
						},
						{
							type: "number",
							enum: [1, 2]
						},
						{
							type: "null"
						}
					]
				},
				any_of: {
					"anyOf": [{
						"type": "number"
					}, {
						"type": "string"
					}, {
						"type": "integer"
					}, {
						"type": "null"
					}]
				},
				all_of: {
					"allOf": [{
						"type": "number"
					}, {
						"type": "string"
					}, {
						"type": "integer"
					}]
				},
				intBetween: {
					type: 'integer',
					minimum: -1,
					exclusiveMaximum: 10,
				},
				intLT: {
					type: 'integer',
					minimum: 0,
					exclusiveMaximum: 10,
				},
				intInArr: {
					type: 'array',
					items: {
						type: 'integer',
						minimum: 0,
						maximum: 10,
					}
				},
			}
		});
	});

	it('OBJECT_NAME = json-schema', function () {
		var res;

		res = parser(`Schema = {test1: string}`);
		expect(schemas).to.property('Schema');
		expect(res).to.eql({
			"title": "Schema",
			"type": "object",
			"additionalProperties": false,
			"required": ["test1"],
			"properties": {
				test1: {
					"type": "string"
				}
			}
		});


		res = parser(`Schema.field = {test2: string}`);
		expect(schemas).to.property('Schema.field');
		expect(res).to.eql({
			"title": "Schema.field",
			"type": "object",
			"additionalProperties": false,
			"required": ["test2"],
			"properties": {
				test2: {
					"type": "string"
				}
			}
		});

		res = parser(`Schema.field1.field2 = {test3: string}`);
		expect(schemas).to.property('Schema.field1.field2');
		expect(res).to.eql({
			"title": "Schema.field1.field2",
			"type": "object",
			"additionalProperties": false,
			"required": ["test3"],
			"properties": {
				test3: {
					"type": "string"
				}
			}
		});
	});

	it('OBJECT_NAME', function () {
		parser(`Schema = {test1: string}`);
		parser(`Schema.field = {test2: string}`);
		parser(`Schema.field1.field2 = {test3: string}`);

		var res;

		res = parser(`Schema`);
		expect(res).to.eql({
			"title": "Schema",
			"type": "object",
			"additionalProperties": false,
			"required": ["test1"],
			"properties": {
				test1: {
					"type": "string"
				}
			}
		});

		res = parser(`Schema.field`);
		expect(res).to.eql({
			"title": "Schema.field",
			"type": "object",
			"additionalProperties": false,
			"required": ["test2"],
			"properties": {
				test2: {
					"type": "string"
				}
			}
		});

		res = parser(`Schema.field1.field2`);
		expect(res).to.eql({
			"title": "Schema.field1.field2",
			"type": "object",
			"additionalProperties": false,
			"required": ["test3"],
			"properties": {
				test3: {
					"type": "string"
				}
			}
		});
	});

	it('OBJECT_NAME = OBJECT_NAME', function () {
		parser(`AnotherSchema = {test1: string}`);
		parser(`AnotherSchema.field = {test2: string}`);
		parser(`AnotherSchema.field1.field2 = {test3: string}`);

		var test1 = {
			"type": "object",
			"additionalProperties": false,
			"required": ["test1"],
			"properties": {
				test1: {
					"type": "string"
				}
			}
		};
		var test2 = {
			"type": "object",
			"additionalProperties": false,
			"required": ["test2"],
			"properties": {
				test2: {
					"type": "string"
				}
			}
		};
		var test3 = {
			"type": "object",
			"additionalProperties": false,
			"required": ["test3"],
			"properties": {
				test3: {
					"type": "string"
				}
			}
		};

		var res;

		res = parser(`Schema = AnotherSchema`);
		expect(res).to.eql({...test1, title: 'Schema'});
		res = parser(`Schema`);
		expect(res).to.eql({...test1, title: 'Schema'});

		res = parser(`Schema.field = AnotherSchema`);
		expect(res).to.eql({...test1, title: 'Schema.field'});
		res = parser(`Schema.field`);
		expect(res).to.eql({...test1, title: 'Schema.field'});

		res = parser(`Schema.field1.field2 = AnotherSchema`);
		expect(res).to.eql({...test1, title: 'Schema.field1.field2'});
		res = parser(`Schema.field1.field2`);
		expect(res).to.eql({...test1, title: 'Schema.field1.field2'});

		res = parser(`Schema = AnotherSchema.field`);
		expect(res).to.eql({...test2, title: 'Schema'});
		res = parser(`Schema`);
		expect(res).to.eql({...test2, title: 'Schema'});

		res = parser(`Schema = AnotherSchema.field1.field2`);
		expect(res).to.eql({...test3, title: 'Schema'});
		res = parser(`Schema`);
		expect(res).to.eql({...test3, title: 'Schema'});

		res = parser(`Schema.field = AnotherSchema.field`);
		expect(res).to.eql({...test2, title: 'Schema.field'});
		res = parser(`Schema.field`);
		expect(res).to.eql({...test2, title: 'Schema.field'});

		res = parser(`Schema.field1.field2 = AnotherSchema.field`);
		expect(res).to.eql({...test2, title: 'Schema.field1.field2'});
		res = parser(`Schema.field1.field2`);
		expect(res).to.eql({...test2, title: 'Schema.field1.field2'});

		res = parser(`Schema.field = AnotherSchema.field1.field2`);
		expect(res).to.eql({...test3, title: 'Schema.field'});
		res = parser(`Schema.field`);
		expect(res).to.eql({...test3, title: 'Schema.field'});

		res = parser(`Schema.field1.field2 = AnotherSchema.field1.field2`);
		expect(res).to.eql({...test3, title: 'Schema.field1.field2'});
		res = parser(`Schema.field1.field2`);
		expect(res).to.eql({...test3, title: 'Schema.field1.field2'});
	});

	it(`OBJECT_NAME && OBJECT_NAME`, function () {
		parser(`One = {test1: string}`);
		parser(`Two = {test2: string}`);
		parser(`Three = {test3: string}`);

		var res = parser(`AllOf = One && Two && Three`);

		expect(res).to.eql(parser('AllOf')).and.to.eql({
			"title": "AllOf",
			"allOf": [{
				"title": "One",
				"type": "object",
				"additionalProperties": false,
				"required": ["test1"],
				"properties": {
					test1: {
						"type": "string"
					}
				}
			}, {
				"title": "Two",
				"type": "object",
				"additionalProperties": false,
				"required": ["test2"],
				"properties": {
					test2: {
						"type": "string"
					}
				}
			}, {
				"title": "Three",
				"type": "object",
				"additionalProperties": false,
				"required": ["test3"],
				"properties": {
					test3: {
						"type": "string"
					}
				}
			}]
		});
		res = parser(`AnyOf = One || Two || Three`);

		expect(res).to.eql(parser('AnyOf')).and.to.eql({
			"title": "AnyOf",
			"anyOf": [{
				"title": "One",
				"type": "object",
				"additionalProperties": false,
				"required": ["test1"],
				"properties": {
					test1: {
						"type": "string"
					}
				}
			}, {
				"title": "Two",
				"type": "object",
				"additionalProperties": false,
				"required": ["test2"],
				"properties": {
					test2: {
						"type": "string"
					}
				}
			}, {
				"title": "Three",
				"type": "object",
				"additionalProperties": false,
				"required": ["test3"],
				"properties": {
					test3: {
						"type": "string"
					}
				}
			}]
		});
	});

	it(`Extend schema`, function () {
		parser(`One = {test1: string, field: string}`);
		parser(`Two = {test1: number, name: string}`);
		parser(`Three = {test3: string, [test4]: string, [wasReq]: string, [wasOpt]: string}`);
		parser(`Four = !!{type: "object", testOption1: "test1", testOption2: "test2"}`);
		parser(`Five = !!{type: "object", testOption1: "testA", testOption3: "test3", properties: {test5: {type: "string"}}}`);

		var res = parser(`{
			id: number,
			field: number,
			wasReq: number,
			...One,
			...Two,
			...Three,
			...Four,
			...Five,
			name: undefined,
			wasOpt: number,
			date: string,
		}`);

		expect(res).to.eql({
			"type": "object",
			"additionalProperties": false,
			"required": ["id", "field", "test1", "test3", "wasOpt", "date"],
			"properties": {
				id: {
					"type": "number"
				},
				field: {
					"type": "string"
				},
				test1: {
					"type": "number"
				},
				test3: {
					"type": "string"
				},
				test4: {
					"type": "string"
				},
				wasReq: {
					"type": "string"
				},
				test5: {
					type: "string"
				},
				wasOpt: {
					"type": "number"
				},
				date: {
					"type": "string"
				}
			},
			testOption1: "testA",
			testOption2: "test2",
			testOption3: "test3"
		});
	});

	it('deps', function () {
		const s = {...defaultSchemas};

		var schema1 = getAstSchema(`{id: Test}`, {schemas: s});
		var schema2 = getAstSchema(`Test = !!{type: "number"}`, {schemas: s});

		var res = generateAjvSchema(schema1, {schemas: s});

		expect(res).to.eql({
			type: 'object',
			"additionalProperties": false,
			required: ['id'],
			properties: {
				id: {
					"title": "Test",
					type: 'number'
				}
			}
		});

		res = generateAjvSchema(schema2, {schemas: s});

		expect(res).to.eql({
			"title": "Test",
			type: 'number'
		});
	});

	it('Schema methods', function () {
		parser(`User = {id: number, [name]: string, [age]: number}`);
		parser(`Test1 = User.pick('id', 'name')`);
		parser(`Test2 = User.remove('id', 'name')`);
		parser(`Test3 = User.add({token: uuid})`);
		parser(`Test4 = User.required('name')`);
		parser(`Test5 = User.notRequired('id')`);
		parser(`Test6 = Test5.set('required', User.get('required'))`);
		parser(`Test7 = User.prop('id')`);
		parser(`Test8 = User.set('additionalProperties', true)`);
		parser(`Test9 = {uuid: User.prop('name')}`);
		parser(`Test10 = /d+/.set('minLength', 10)`);
		parser(`Test11 = (!!{type: 'string'}).set('minLength', 10)`);
		parser(`Test12 = number.not({minimum: 10})`);
		parser(`Total = User
			.pick('id', 'name')
			.remove('id')
			.add({token: uuid})
			.required('name')
			.notRequired('token')
			.set('additionalProperties', true)
		`);

		var c = schemas;

		schemas = {...defaultSchemas};

		var g = generateAjvSchema;
		var p = parser;

		expect(g(c.Test1)).to.eql(p(`Test1 = {id: number, [name]: string}`));
		expect(g(c.Test2)).to.eql(p(`Test2 = {[age]: number}`));
		expect(g(c.Test3)).to.eql(p(`Test3 = {id: number, [name]: string, [age]: number, token: uuid}`));
		expect(g(c.Test4)).to.eql(p(`Test4 = {id: number, name: string, [age]: number}`));
		expect(g(c.Test5)).to.eql(p(`Test5 = {[id]: number, [name]: string, [age]: number}`));
		expect(g(c.Test6)).to.eql(p(`Test6 = {id: number, [name]: string, [age]: number}`));
		expect(g(c.Test7)).to.eql(p(`Test7 = number`));
		expect(g(c.Test9)).to.eql(p(`Test9 = {uuid: string}`));
		expect(g(c.Test10)).to.eql(p(`Test10 = !!{type: 'string', pattern: "d+", minLength: 10}`));
		expect(g(c.Test11)).to.eql(p(`Test11 = !!{type: 'string', 'minLength': 10}`));
		expect(g(c.Test12)).to.eql(p(`Test12 = !!{type: 'number', not: {minimum: 10}}`));
	});

	it('Object schema $ props', function () {
		var p = parser;
		expect(p(`{id: number, $additionalProperties: true, $propertyNames: uuid, token: string}`)).to.eql({
			type: 'object',
			additionalProperties: true,
			propertyNames: {
				type: 'string',
				format: 'uuid',
			},
			required: ['id', 'token'],
			properties: {
				id: {type: 'number'},
				token: {type: 'string'},
			}
		});
		expect(p(`{id: number, name: string, $required: [], token: string}`)).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['token'],
			properties: {
				id: {type: 'number'},
				name: {type: 'string'},
				token: {type: 'string'},
			}
		});
		expect(p(`{$maxProperties: 5}`)).to.eql({
			type: 'object',
			additionalProperties: false,
			required: [],
			properties: {},
			maxProperties: 5,
		});

		const set = require('../methods/set');

		expect(originParser(`{test: 'one', $test: 1}`, {
			objectOptions: {
				test: function (schema, args, params) {
					return set(schema, ['success', args[0]], params);
				}
			}
		})).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['test'],
			properties: {
				test: {const: 'one'}
			},
			success: 1,
		});
	});

	it('array contains syntax', function () {
		var p = parser;
		expect(p(`[number]`)).to.eql({
			type: 'array',
			items: {type: 'number'},
		});
		expect(p(`!![number]`)).to.eql({
			type: 'array',
			items: {type: 'number'},
			minItems: 1,
			maxItems: 1,
		});
		expect(p(`[number, string]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'string'},
			],
		});
		expect(p(`!![number, string]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'string'},
			],
			minItems: 2,
			maxItems: 2,
		});
		expect(p(`[...number]`)).to.eql({
			type: 'array',
			contains: {type: 'number'},
		});
		expect(p(`[number, ...string]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'}
			],
			additionalItems: {type: 'string'},
		});
		expect(parser(`[number, ...string]`, {schemaVersion: '2020'})).to.eql({
			type: 'array',
			prefixItems: [
				{type: 'number'}
			],
			items: {type: 'string'},
		});
		expect(p(`[number, number, ...string]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'number'},
			],
			additionalItems: {type: 'string'},
		});
		expect(p(`[number, number, ...(string || boolean)]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'number'},
			],
			additionalItems: {
				anyOf: [
					{type: 'string'},
					{type: 'boolean'},
				]
			},
		});
		expect(p(`[number, number, ...(string || boolean)].minContains(1).maxContains(5)`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'number'},
			],
			additionalItems: {
				anyOf: [
					{type: 'string'},
					{type: 'boolean'},
				]
			},
			minContains: 1,
			maxContains: 5,
		});
		expect(p(`[...(string || boolean)].items(number)`)).to.eql({
			type: 'array',
			items: {type: 'number'},
			contains: {
				anyOf: [
					{type: 'string'},
					{type: 'boolean'},
				]
			}
		});
		expect(p(`[].items([number])`)).to.eql({
			type: 'array',
			items: [{type: 'number'}],
		});
		expect(p(`[]`)).to.eql({
			type: 'array',
		});
		expect(p(`!![]`)).to.eql({
			type: 'array',
			minItems: 0,
			maxItems: 0,
		});
		expect(p(`array.items([number])`)).to.eql({
			type: 'array',
			items: [{type: 'number'}],
		});
		expect(p(`array.maxItems(5)`)).to.eql({
			type: 'array',
			maxItems: 5,
		});
		expect(p(`array`)).to.eql({
			type: 'array',
		});
	});

	it('arrow function as code', function () {
		var res = parser(User => ({[name]: string}));

		expect(schemas).to.have.property('User');
		expect(res).to.eql({
			title: 'User',
			type: 'object',
			additionalProperties: false,
			required: [],
			properties: {
				name: {
					type: 'string'
				}
			},
		});

		res = parser(() => Test.Schema = {...User, test: number});

		expect(schemas).to.have.property('User');
		expect(res).to.eql({
			title: 'Test.Schema',
			type: 'object',
			additionalProperties: false,
			required: ['test'],
			properties: {
				name: {
					type: 'string'
				},
				test: {
					type: 'number'
				},
			},
		});

		res = parser((Test2) => Test.Schema.omit('test'));

		expect(res).to.eql({
			title: 'Test2',
			type: 'object',
			additionalProperties: false,
			required: [],
			properties: {
				name: {
					type: 'string'
				}
			},
		});
	});

	it('type as string const', function () {
		var res = parser(Test => ({type: "test"}));

		expect(res).to.eql({
			title: 'Test',
			type: 'object',
			required: ['type'],
			additionalProperties: false,
			properties: {
				type: {
					const: "test",
				}
			}
		});
	});

	it('prop name as regexp', function () {
		var res = parser(Test => ({[/^\d+$/]: string}));

		expect(res).to.eql({
			title: 'Test',
			type: 'object',
			required: [],
			additionalProperties: false,
			properties: {},
			patternProperties: {
				"^\\d+$": {
					type: "string",
				}
			}
		});
	});

	it('string or null', function () {
		var res = parser(Test => ({test: string || null}));

		expect(res).to.eql({
			title: 'Test',
			type: 'object',
			required: ['test'],
			additionalProperties: false,
			properties: {
				test: {
					anyOf: [
						{type: 'string'},
						{type: 'null'}
					]
				}
			},
		});

		res = parser(Test2 => ({test: 'string' || 'null'}));

		expect(res).to.eql({
			title: 'Test2',
			type: 'object',
			required: ['test'],
			additionalProperties: false,
			properties: {
				test: {
					type: 'string',
					enum: ['string', 'null'],
				}
			},
		});

		res = parser(Test3 => ({test: 'a' || null}));

		expect(res).to.eql({
			title: 'Test3',
			type: 'object',
			required: ['test'],
			additionalProperties: false,
			properties: {
				test: {
					anyOf: [
						{const: 'a'},
						{type: 'null'}
					]
				}
			},
		});
	});

	it('$ref', function () {
		var res = parser(Test => ({test: !!{$ref: "asd"}}));

		expect(res).to.eql({
			title: 'Test',
			type: 'object',
			required: ['test'],
			additionalProperties: false,
			properties: {
				test: {
					$ref: "asd"
				}
			},
		});

		res = parser(Test2 => ({test: 1, $ref: 'one'}));

		expect(res).to.eql({
			title: 'Test2',
			type: 'object',
			required: ['test'],
			additionalProperties: false,
			properties: {
				test: {const: 1},
			},
			$ref: 'one',
		});
	});

	it('>> to if:', function () {
		var res = parser(Test => (
			{id: 1} >>
			{test: 'one'}
		));

		expect(res).to.eql({
			title: 'Test',
			if: {
				type: 'object',
				additionalProperties: true,
				required: ['id'],
				properties: {
					id: {const: 1}
				}
			},
			then: {
				type: 'object',
				required: ['id', 'test'],
				additionalProperties: false,
				properties: {
					id: {const: 1},
					test: {const: 'one'},
				}
			}
		});

		parser(User => (
			{name: 'User'}
		));

		res = parser(Test2 => (
			User >>
			{test: 'test2'}
		));

		expect(res).to.eql({
			title: 'Test2',
			if: {
				title: 'User',
				type: 'object',
				additionalProperties: true,
				required: ['name'],
				properties: {
					name: {const: 'User'}
				}
			},
			then: {
				type: 'object',
				required: ['name', 'test'],
				additionalProperties: false,
				properties: {
					name: {const: 'User'},
					test: {const: 'test2'},
				}
			}
		});

		parser(User2 => (
			{test: 'User2'}
		));

		res = parser(Test3 => (
			User.add({id: number}) >>
			User2.optional('test')
		));

		expect(res).to.eql({
			title: 'Test3',
			if: {
				type: 'object',
				additionalProperties: true,
				required: ['name', 'id'],
				properties: {
					name: {const: 'User'},
					id: {type: 'number'},
				}
			},
			then: {
				type: 'object',
				required: ['name', 'id'],
				additionalProperties: false,
				properties: {
					name: {const: 'User'},
					id: {type: 'number'},
					test: {const: 'User2'},
				}
			}
		});
	});

	it('switch', function () {
		var res = parser(Test => (
			(
				{id: 1} >>
				{title: 'one'}
			) ||
			(
				{id: 2} >>
				{title: 'two'}
			) ||
			(
				{id: 3} >>
				{title: 'three'}
			)
		));

		expect(res).to.eql({
			title: 'Test',
			if: {
				type: 'object',
				additionalProperties: true,
				required: ['id'],
				properties: {
					id: {const: 1}
				}
			},
			then: {
				type: 'object',
				required: ['id', 'title'],
				additionalProperties: false,
				properties: {
					id: {const: 1},
					title: {const: 'one'},
				}
			},
			else: {
				if: {
					type: 'object',
					additionalProperties: true,
					required: ['id'],
					properties: {
						id: {const: 2}
					}
				},
				then: {
					type: 'object',
					required: ['id', 'title'],
					additionalProperties: false,
					properties: {
						id: {const: 2},
						title: {const: 'two'},
					}
				},
				else: {
					if: {
						type: 'object',
						additionalProperties: true,
						required: ['id'],
						properties: {
							id: {const: 3}
						}
					},
					then: {
						type: 'object',
						required: ['id', 'title'],
						additionalProperties: false,
						properties: {
							id: {const: 3},
							title: {const: 'three'},
						}
					},
					else: {
						oneOf: [
							{
								type: 'object',
								additionalProperties: true,
								required: ['id'],
								properties: {
									id: {const: 1}
								}
							},
							{
								type: 'object',
								additionalProperties: true,
								required: ['id'],
								properties: {
									id: {const: 2}
								}
							},
							{
								type: 'object',
								additionalProperties: true,
								required: ['id'],
								properties: {
									id: {const: 3}
								}
							},
						]
					},
				}
			}
		});
	});

	it('ternary', function () {
		var res = parser(Test => (
			int ? (-1 || id) : null
		));

		expect(res).to.eql({
			title: 'Test',
			if: {type: 'integer'},
			then: {
				anyOf: [
					{const: -1},
					{type: 'integer', minimum: 1}
				]
			},
			else: {
				type: 'null'
			}
		});
	});

	it('pure syntax', function () {
		var res = parser(Test1 => (
			{
				...!!{
					additionalProperties: true,
					test: 2,
				},

				test: 1,
			}
		));

		expect(res).to.eql({
			title: 'Test1',
			type: 'object',
			additionalProperties: true,
			required: ['test'],
			properties: {
				test: {const: 1},
			},
			test: 2,
		});

		res = parser(Test2 => (
			{
				...!!{
					additionalProperties: true,
					test: 2,
					test3: 5,
					required: ['id'],
					properties: {
						id: {const: 3}
					},
				},
				...!!{
					additionalProperties: false,
					test: 3,
					test2: 4,
					required: ['name'],
					properties: {
						name: {const: 2}
					},
				},

				test: 1,
			}
		));

		expect(res).to.eql({
			title: 'Test2',
			type: 'object',
			additionalProperties: false,
			required: ['name', 'test'],
			properties: {
				test: {const: 1},
				name: {const: 2},
			},
			test: 3,
			test2: 4,
			test3: 5,
		});

		res = parser(Test3 => (!!{
			type: 'string',
			test: string,
			deep: {
				test: {
					value: int
				}
			}
		}));

		expect(res).to.eql({
			title: 'Test3',
			type: 'string',
			test: {type: 'string'},
			deep: {
				test: {
					value: {type: 'integer'}
				}
			}
		});
	});

	it('description', function () {
		var res = parser(`
			# main desc
			{
				// desc 1
				test1: 1,
				test2: 2, // desc 2
				// desc 3
				test3: 3, // omit desc
				test4: 4, // desc 4
			}
		`);

		expect(res).to.eql({
			description: 'main desc',
			type: 'object',
			additionalProperties: false,
			required: ['test1', 'test2', 'test3', 'test4'],
			properties: {
				test1: {
					description: 'desc 1',
					const: 1,
				},
				test2: {
					description: 'desc 2',
					const: 2,
				},
				test3: {
					description: 'desc 3',
					const: 3,
				},
				test4: {
					description: 'desc 4',
					const: 4,
				},
			},
		});

		res = parser(`
			# test desc1
			Test1 = {id: 1}
		`);

		expect(res).to.eql({
			title: 'Test1',
			description: 'test desc1',
			type: 'object',
			additionalProperties: false,
			required: ['id'],
			properties: {
				id: {const: 1},
			},
		});

		res = parser(`
			// test desc2
			Test2 = {id: 1}
		`);

		expect(res).to.eql({
			title: 'Test2',
			description: 'test desc2',
			type: 'object',
			additionalProperties: false,
			required: ['id'],
			properties: {
				id: {const: 1},
			},
		});

		res = parser(`
			# test desc2
			!!{id: 1}
		`);

		expect(res).to.eql({
			description: 'test desc2',
			id: 1,
		});

		res = parser(`
			// test desc 3
			string
		`);

		expect(res).to.eql({
			description: 'test desc 3',
			type: 'string',
		});
	});
});

describe('schemas', function () {
	const Ajv = require('ajv').default;
	const ajv = new Ajv();
	require('ajv-formats')(ajv);

	it('null', function () {
		var schema = require('../schemas/null');
		var test = ajv.compile(schema);

		test(null);
		expect(test.errors).to.be.null;

		test(0);
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);

		test(false);
		expect(test.errors).to.have.length(1);

		test({});
		expect(test.errors).to.have.length(1);
	});

	it('object', function () {
		var schema = require('../schemas/object');
		var test = ajv.compile(schema);

		test({});
		expect(test.errors).to.be.null;

		test({a: 1});
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);

		test(false);
		expect(test.errors).to.have.length(1);

		test(null);
		expect(test.errors).to.have.length(1);
	});

	it('string', function () {
		var schema = require('../schemas/string');
		var test = ajv.compile(schema);

		test('');
		expect(test.errors).to.be.null;

		test('text');
		expect(test.errors).to.be.null;

		test(1);
		expect(test.errors).to.have.length(1);
	});

	it('number', function () {
		var schema = require('../schemas/number');
		var test = ajv.compile(schema);

		test(1);
		expect(test.errors).to.be.null;

		test(0);
		expect(test.errors).to.be.null;

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('int', function () {
		var schema = require('../schemas/int');
		var test = ajv.compile(schema);

		test(1);
		expect(test.errors).to.be.null;

		test(-1);
		expect(test.errors).to.be.null;

		test(1.5);
		expect(test.errors).to.have.length(1);
	});

	it('positive', function () {
		var schema = require('../schemas/positive');
		var test = ajv.compile(schema);

		test(1);
		expect(test.errors).to.be.null;

		test(0);
		expect(test.errors).to.be.null;

		test(-1);
		expect(test.errors).to.have.length(1);
	});

	it('negative', function () {
		var schema = require('../schemas/negative');
		var test = ajv.compile(schema);

		test(-1);
		expect(test.errors).to.be.null;

		test(0);
		expect(test.errors).to.have.length(1);

		test(1);
		expect(test.errors).to.have.length(1);
	});

	it('id', function () {
		var schema = require('../schemas/id');
		var test = ajv.compile(schema);

		test(1);
		expect(test.errors).to.be.null;

		test(0);
		expect(test.errors).to.have.length(1);

		test(-1);
		expect(test.errors).to.have.length(1);
	});

	it('boolean', function () {
		var schema = require('../schemas/boolean');
		var test = ajv.compile(schema);

		test(true);
		expect(test.errors).to.be.null;
		test(false);
		expect(test.errors).to.be.null;

		test(0);
		expect(test.errors).to.have.length(1);

		test(null);
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('date', function () {
		var schema = require('../schemas/date');
		var test = ajv.compile(schema);

		test('2000-01-01');
		expect(test.errors).to.be.null;

		test('2000-01-01 10:10:10');
		expect(test.errors).to.have.length(1);

		test('2000-01-01T10:10:10');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('time', function () {
		var schema = require('../schemas/time');
		var test = ajv.compile(schema);

		test('10:10:10');
		expect(test.errors).to.be.null;

		test('2000-01-01 10:10:10');
		expect(test.errors).to.have.length(1);

		test('2000-01-01T10:10:10');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('date-time', function () {
		var schema = require('../schemas/date-time');
		var test = ajv.compile(schema);

		test('2000-01-01 10:10:10');
		expect(test.errors).to.be.null;

		test('2000-01-01T10:10:10');
		expect(test.errors).to.be.null;

		test('2000-01-01');
		expect(test.errors).to.have.length(1);

		test('10:10:10');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('date-time-tz', function () {
		var schema = require('../schemas/date-time-tz');
		var test = ajv.compile(schema);

		test('2000-01-01 10:10:10+02');
		expect(test.errors).to.be.null;

		test('2000-01-01T10:10:10+02');
		expect(test.errors).to.be.null;

		test('2000-01-01T10:10:10');
		expect(test.errors).to.have.length(1);

		test('10:10:10');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('email', function () {
		var schema = require('../schemas/email');
		var test = ajv.compile(schema);

		test('test@mail.com');
		expect(test.errors).to.be.null;

		test('testmail.com');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('hostname', function () {
		var schema = require('../schemas/hostname');
		var test = ajv.compile(schema);

		test('domain.com');
		expect(test.errors).to.be.null;

		test('http://domain.com');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('filename', function () {
		var schema = require('../schemas/filename');
		var test = ajv.compile(schema);

		test('file-name.ext1');
		expect(test.errors).to.be.null;

		test('dir/file.ext');
		expect(test.errors).to.have.length(1);

		test('../file.ext');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('ipv4', function () {
		var schema = require('../schemas/ipv4');
		var test = ajv.compile(schema);

		test('1.1.1.1');
		expect(test.errors).to.be.null;

		test('255.255.255.255');
		expect(test.errors).to.be.null;

		test('1');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('ipv6', function () {
		var schema = require('../schemas/ipv6');
		var test = ajv.compile(schema);

		test('2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d');
		expect(test.errors).to.be.null;

		test('255.255.255.255');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});

	it('regex', function () {
		var schema = require('../schemas/regex');
		var test = ajv.compile(schema);

		test('^\\d$');
		expect(test.errors).to.be.null;

		test('(');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.be.null;
	});

	it('uuid', function () {
		var schema = require('../schemas/uuid');
		var test = ajv.compile(schema);

		test('00000000-1111-2222-3333-000000000000');
		expect(test.errors).to.be.null;

		test('00000000-1111-2222-3333');
		expect(test.errors).to.have.length(1);

		test('');
		expect(test.errors).to.have.length(1);
	});
});

describe('methods', function () {
	const originParser = require('../index');
	const defaultSchemas = require('../schemas');

	var schemas = {};

	const p = function (code, params = {}) {
		return originParser(code, {schemas, ...params});
	};

	beforeEach(function () {
		schemas = {...defaultSchemas};
	});

	describe('object', function () {
		it('props', function () {
			expect(p(`{id: number, [name]: string, age: number}.props('id', 'name')`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: {type: 'number'},
					name: {type: 'string'},
				},
			});

			expect(p(`{id: number, [name]: string, age: number}.props('id', {name: 'test1', "age": 'test2'})`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id', 'test2'],
				properties: {
					id: {type: 'number'},
					test1: {type: 'string'},
					test2: {type: 'number'},
				},
			});

			expect(p(`{id: number, [name]: string, age: number}.props(['id', 'name'])`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: {type: 'number'},
					name: {type: 'string'},
				},
			});

			expect(p(`{id: number, [name]: string, age: number}.props(['id'], 'age')`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id', 'age'],
				properties: {
					id: {type: 'number'},
					age: {type: 'number'},
				},
			});

			expect(p(`{id: number, [name]: string, age: number}.props([{'id': 'test'}, 'age'], 'name')`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['test', 'age'],
				properties: {
					test: {type: 'number'},
					age: {type: 'number'},
					name: {type: 'string'},
				},
			});

			p(`
			# desc
			User = {id: number, name: string}`);

			expect(p(`User.props('id')`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: {type: 'number'},
				},
			});
		});

		it('prop', function () {
			expect(p(`{id: number, name: string}.prop('id')`)).to.eql({
				type: 'number'
			});

			expect(p(`{test: {name: string}}.prop('test').prop('name')`)).to.eql({
				type: 'string'
			});
		});

		it('additionalProperties', function () {
			expect(p(`{id: number}.additionalProperties(true)`)).to.eql({
				type: 'object',
				additionalProperties: true,
				required: ['id'],
				properties: {
					id: {type: 'number'}
				},
			});
		});

		it('dependencies, dependentRequired', function () {
			expect(p(`{id: number}.dependencies({id: ['name']})`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: {type: 'number'}
				},
				dependentRequired: {id: ['name']}
			});
			expect(p(`{id: number}.dependentRequired({id: ['name']})`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: {type: 'number'}
				},
				dependentRequired: {id: ['name']}
			});
		});

		it('minProperties, maxProperties', function () {
			expect(p(`{id: number}.minProperties(1).maxProperties(10)`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: {type: 'number'}
				},
				minProperties: 1,
				maxProperties: 10,
			});
		});

		it('required, notRequired, optional', function () {
			expect(p(`
			{
				test1: number, 
				test2: number, 
				[test3]: number, 
				[test4]: number, 
				[test5]: number,
				test6: number,
				test7: number,
			}
			.required('test3', 'test4')
			.notRequired('test1', 'test2')
			.optional('test5', 'test6')`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['test7', 'test3', 'test4'],
				properties: {
					test1: {type: 'number'},
					test2: {type: 'number'},
					test3: {type: 'number'},
					test4: {type: 'number'},
					test5: {type: 'number'},
					test6: {type: 'number'},
					test7: {type: 'number'},
				},
			});
		});

		it('patternProperties', function () {
			expect(p(`
			{
				test1: number, 
			}
			.patternProperties({
				"^s+$": string,
				"^o+$": {id: number},
			})
			`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['test1'],
				properties: {
					test1: {type: 'number'},
				},
				patternProperties: {
					"^s+$": {type: 'string'},
					"^o+$": {
						type: 'object',
						additionalProperties: false,
						required: ['id'],
						properties: {
							id: {type: 'number'},
						},
					},
				}
			});
		});

		it('propertyNames', function () {
			expect(p(`
			{
				test1: number, 
			}
			.propertyNames(uuid)
			`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['test1'],
				properties: {
					test1: {type: 'number'},
				},
				propertyNames: {
					type: 'string',
					format: 'uuid',
				}
			});
		});

		it('unevaluatedProperties', function () {
			expect(p(`
			{
				test1: number, 
			}
			.unevaluatedProperties(true)
			`)).to.eql({
				type: 'object',
				additionalProperties: false,
				required: ['test1'],
				properties: {
					test1: {type: 'number'},
				},
				unevaluatedProperties: true
			});
		});

		it('id', function () {
			expect(p(`
			{
				test1: number, 
			}
			.id("asd")
			`)).to.eql({
				$id: 'asd',
				type: 'object',
				additionalProperties: false,
				required: ['test1'],
				properties: {
					test1: {type: 'number'},
				},
			});

			expect(p(`
			{
				$id: 'qwe',
				test1: number, 
			}
			`)).to.eql({
				$id: 'qwe',
				type: 'object',
				additionalProperties: false,
				required: ['test1'],
				properties: {
					test1: {type: 'number'},
				},
			});

			expect(p(`
			[!!{$ref: "asd"}].id("qwe")
			`)).to.eql({
				$id: 'qwe',
				type: 'array',
				items: {
					$ref: 'asd',
				},
			});
		});
	});

	describe('array', function () {
		it('additionalItems', function () {
			expect(p(`
			[number]
			.additionalItems(true)
			`)).to.eql({
				type: 'array',
				additionalItems: true,
				items: {
					type: "number"
				}
			});
		});

		it('contains', function () {
			expect(p(`
			[number]
			.contains(string)
			`)).to.eql({
				type: 'array',
				items: {type: "number"},
				contains: {type: 'string'}
			});
		});

		it('minContains, maxContains', function () {
			expect(p(`
			[number]
			.minContains(1)
			.maxContains(10)
			`)).to.eql({
				type: 'array',
				items: {type: "number"},
				minContains: 1,
				maxContains: 10,
			});
		});

		it('minItems, maxItems', function () {
			expect(p(`
			[number]
			.minItems(1)
			.maxItems(10)
			`)).to.eql({
				type: 'array',
				items: {type: "number"},
				minItems: 1,
				maxItems: 10,
			});
		});

		it('unevaluatedItems', function () {
			expect(p(`
			[number]
			.unevaluatedItems(true)
			`)).to.eql({
				type: 'array',
				items: {type: "number"},
				unevaluatedItems: true,
			});
		});

		it('uniqueItems', function () {
			expect(p(`
			[number]
			.uniqueItems(true)
			`)).to.eql({
				type: 'array',
				items: {type: "number"},
				uniqueItems: true,
			});
		});
	});

	describe('number', function () {
		it('minimum, maximum', function () {
			expect(p(`
			number
			.minimum(1)
			.maximum(10)
			`)).to.eql({
				type: 'number',
				minimum: 1,
				maximum: 10,
			});
		});

		it('exclusiveMinimum, exclusiveMaximum', function () {
			expect(p(`
			number
			.exclusiveMinimum(1)
			.exclusiveMaximum(10)
			`)).to.eql({
				type: 'number',
				exclusiveMinimum: 1,
				exclusiveMaximum: 10,
			});
		});

		it('multipleOf', function () {
			expect(p(`
			number
			.multipleOf(2)
			`)).to.eql({
				type: 'number',
				multipleOf: 2,
			});
		});
	});

	describe('string', function () {
		it('minLength, maxLength', function () {
			expect(p(`
			string
			.minLength(1)
			.maxLength(10)
			`)).to.eql({
				type: 'string',
				minLength: 1,
				maxLength: 10,
			});
		});

		it('format', function () {
			expect(p(`
			string
			.format("date")
			`)).to.eql({
				type: 'string',
				format: "date",
			});
		});

		it('pattern', function () {
			expect(p(`
			string
			.pattern("^d+$")
			`)).to.eql({
				type: 'string',
				pattern: "^d+$",
			});
		});
	});

	describe('enum', function () {
		it('notNull', function () {
			expect(p(`
				(string || null).notNull()
			`))
			.to.eql({
				type: 'string',
			});

			expect(p(`
				(null || string).notNull()
			`))
			.to.eql({
				type: 'string',
			});

			expect(p(`
				(int || string || null).notNull()
			`))
			.to.eql({
				type: 'integer',
			});
		});
	});

	it('custom', function () {
		const set = require('../methods/set');

		var res = p(`
			number.test(true)
		`, {
			methods: {
				test: function (schema, args, params) {
					return set(schema, ['test', args[0]], params);
				}
			}
		});

		expect(res).to.eql({
			type: 'number',
			test: true,
		});

		res = p(`
			{
				id: number,
				
				$test: 1,
			}
		`, {
			objectOptions: {
				test: function (schema, args, params) {
					return set(schema, ['test', args[0]], params);
				}
			}
		});

		expect(res).to.eql({
			type: 'object',
			test: 1,
			additionalProperties: false,
			required: ['id'],
			properties: {
				id: {type: 'number'}
			}
		});
	});

	it('function', function () {
		const t = require('@babel/types');

		var schema = p(`{
			id: test(1, "2")
		}`, {
			functions: {
				test: function (args) {
					return t.stringLiteral('test=' + args.map(n => n.value).join('-'));
				}
			}
		});

		expect(schema).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['id'],
			properties: {
				id: "test=1-2"
			}
		});
	});

	it('propItems', function () {
		expect(p(`{test: [number], name: string}.propItems('test')`)).to.eql({
			type: 'number'
		});
	});
});

describe('errors', function () {
	const parser = require('../index');
	const toAst = require('../lib/toAst');
	const AdvSyntaxError = require('../lib/AdvSyntaxError');
	const AdvReferenceError = require('../lib/AdvReferenceError');
	const RuntimeError = require('../lib/RuntimeError');

	it('should throw babel syntax error', function () {
		const code = `\n{\n\tid: \n}`;
		expect(() => parser(code, {sourceFilename: '/some/test.js', startLine: 100, startColumn: 10}))
		.to.throw(SyntaxError, 'Unexpected token')
		.and.deep.include({
			code: code,
			loc: {
				line: 103,
				column: 0,
				index: 9,
			},
			filename: '/some/test.js'
		});
	});

	it('should throw adv syntax error', function () {
		expect(() => parser(`{id: 1 | 2}`))
		.to.throw(AdvSyntaxError, 'Unknown syntax')
		.with.property('loc');
	});

	it('should throw adv reference error', function () {
		expect(() => parser(`{id: a}`))
		.to.throw(AdvReferenceError, 'Unknown reference: "a"')
		.with.property('loc');
	});

	it('should throw runtime error', function () {
		expect(() => parser(`{id: string.minLength()}`))
		.to.throw(RuntimeError, 'Method "minLength" required one argument')
		.with.property('loc');
	});
});