const {expect} = require('chai');

describe('parseSchema', function () {
	const originParser = require('../index');
	const defaultSchemas = require('../schemas');
	const {getAstSchema, generateAjvSchema} = originParser;
	
	var schemas = {};
	
	const parser = function (code) {
		return originParser(code, {schemas});
	};

	beforeEach(function () {
		schemas = {...defaultSchemas};
	});

	it('json-schema', function () {
		var res = parser(`
			{
				id: number,
				name: string,
				date: date-time-tz,
				regex: /^\\d+$/,
				[optional]: string,
				listInt: [int],
				listStr: [{
					type: 'string'
				}],
				listObj: [{
					type: string
				}],
				listOr: [number || string],
				listTwo: [number, string],
				enumInt: 1 || 2 || 3,
				enumStr: "user" || 'account' || "item",
				any_of: number || string || int || null,
				all_of: number && string && int,
			}
		`);

		expect(res).to.eql({
			"type": "object",
			"additionalProperties": false,
			"required": ["id", "name", "date", "regex", "listInt", "listStr", "listObj", "listOr", "listTwo", "enumInt", "enumStr", "any_of", "all_of"],
			"properties": {
				id: {
					"type": "number"
				},
				name: {
					"type": "string"
				},
				date: {
					"type": "string",
					pattern: "^\\d{4}-[01]\\d-[0-3]\\d[tT\\s](?:[0-2]\\d:[0-5]\\d:[0-5]\\d|23:59:60)(?:\\.\\d+)?(?:z|[+-]\\d{2}(?::?\\d{2})?)$",
				},
				regex: {
					"type": "string",
					pattern: "^\\d+$",
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
					"enum": [1, 2, 3]
				},
				enumStr: {
					"type": "string",
					"enum": ["user", "account", "item"]
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
				}
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
		parser(`Four = {type: "object", testOption1: "test1", testOption2: "test2"}`);
		parser(`Five = {type: "object", testOption1: "testA", testOption3: "test3", properties: {test5: {type: "string"}}}`);

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
		var schema2 = getAstSchema(`Test = {type: "number"}`, {schemas: s});

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

	it('extend {...{},}', function () {
		var schema = parser(`
			{
				...{
					name: string,
				},
				type: "object",
				additionalProperties: true,
			}
		`);

		expect(schema).to.eql({
			type: 'object',
			additionalProperties: true,
			required: ['name'],
			properties: {
				name: {
					type: 'string'
				}
			}
		});

		schema = parser(`
			{
				type: "object",
				additionalProperties: true,
				extra: "test",
				...{
					name: string,
				},
			}
		`);

		expect(schema).to.eql({
			type: 'object',
			additionalProperties: false,
			extra: "test",
			required: ['name'],
			properties: {
				name: {
					type: 'string'
				}
			}
		});

		schema = parser(`
			{
				type: "object",
				...{
					name: string,
				},
				additionalProperties: true,
				...{
					id: number,
					name: number,
					test: string,
				},
				required: ['id', 'name'],
			}
		`);

		expect(schema).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['id', 'name'],
			properties: {
				id: {
					type: 'number'
				},
				name: {
					type: 'number'
				},
				test: {
					type: 'string'
				}
			}
		});

		schema = parser(`
			{
				...string,
				type: "string",
				extra: 'test',
			}
		`);

		expect(schema).to.eql({
			type: 'string',
			extra: 'test',
		});

		parser(`File = {id: id, name: string, path: string}`);

		schema = parser(`
			{
				...File,
				id: undefined,
				...{
					type: 'object',
					required: ['name']
				},
			}
		`);

		expect(schema).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['name'],
			properties: {
				name: {
					type: 'string'
				},
				path: {
					type: 'string'
				}
			}
		});

		schema = parser(`
			{
				...File,
				
				type: 'object',
				required: ['name'],
			}
		`);

		expect(schema).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['name'],
			properties: {
				id: {
					type: 'integer',
					minimum: 1,
				},
				name: {
					type: 'string'
				},
				path: {
					type: 'string'
				}
			}
		});
	});

	it('Schema methods', function () {
		parser(`User = {id: number, 'name?': string, [age]: number}`);
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
		parser(`Test11 = {type: 'string'}.set('minLength', 10)`);
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

		expect(g(c.Test1)).to.eql(p(`Test1 = {id: number, 'name?': string}`));
		expect(g(c.Test2)).to.eql(p(`Test2 = {[age]: number}`));
		expect(g(c.Test3)).to.eql(p(`Test3 = {id: number, 'name?': string, [age]: number, token: uuid}`));
		expect(g(c.Test4)).to.eql(p(`Test4 = {id: number, name: string, [age]: number}`));
		expect(g(c.Test5)).to.eql(p(`Test5 = {[id]: number, [name]: string, [age]: number}`));
		expect(g(c.Test6)).to.eql(p(`Test6 = {id: number, [name]: string, [age]: number}`));
		expect(g(c.Test7)).to.eql(p(`Test7 = number`));
		expect(g(c.Test8)).to.eql(p(`Test8 = {id: number, [name]: string, [age]: number, ...{type: 'object', additionalProperties: true}}`));
		expect(g(c.Test9)).to.eql(p(`Test9 = {uuid: string}`));
		expect(g(c.Test10)).to.eql(p(`Test10 = {type: 'string', pattern: "d+", minLength: 10}`));
		expect(g(c.Test11)).to.eql(p(`Test11 = {type: 'string', 'minLength': 10}`));
		expect(g(c.Test12)).to.eql(p(`Test12 = {type: 'number', not: {minimum: 10}}`));
		expect(g(c.Total)).to.eql(p(`Total = {name: string, [token]: uuid, ...{type: 'object', additionalProperties: true}}`));

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
	});

	it('array contains syntax', function () {
		var p = parser;
		expect(p(`[number]`)).to.eql({
			type: 'array',
			items: {type: 'number'},
		});
		expect(p(`[number, string]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'string'},
			],
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
			contains: {type: 'string'},
		});
		expect(p(`[number, number, ...string]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'number'},
			],
			contains: {type: 'string'},
		});
		expect(p(`[number, number, ...(string || boolean)]`)).to.eql({
			type: 'array',
			items: [
				{type: 'number'},
				{type: 'number'},
			],
			contains: {
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
			contains: {
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
});