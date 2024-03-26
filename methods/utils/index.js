const t = require('@babel/types');
const {getPropStringValue} = require('../../lib/object');
const AdvSyntaxError = require('../../lib/AdvSyntaxError');
const RuntimeError = require('../../lib/RuntimeError');

// noinspection JSUnusedGlobalSymbols
module.exports = {
	setMethodName,
	method: setMethodName,
	getMethodName,
	isObject,
	isString,
	isNumber,
	isArray,
	argType,
	firstType,
	firstObject,
	firstArray,
	firstString,
	firstNumber,
	firstBoolean,
	oneArg,
	atLeastOne,
	maxTwo,
	objectOrTwo,
	onlyStrings,
};

let curMethodName = 'unknown';

function setMethodName(name) {
	curMethodName = name;
}

function getMethodName() {
	return curMethodName;
}

function isObject(schema) {
	if (getPropStringValue(schema, 'type') !== 'object') {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} allowed only for "object" schema`);
	}
}

function isString(schema) {
	if (getPropStringValue(schema, 'type') !== 'string') {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} allowed only for "string" schema`);
	}
}

function isNumber(schema) {
	const type = getPropStringValue(schema, 'type');

	if (type !== 'number' && type !== 'integer') {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} allowed only for "number" schema`);
	}
}

function isArray(schema) {
	if (getPropStringValue(schema, 'type') !== 'array') {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} allowed only for "array" schema`);
	}
}

function argType(num, value, type) {
	if (Array.isArray(type)) {
		for (const _type of type) {
			argType(num, value, _type);
		}
		return;
	}

	switch (type) {
	case 'object':
		if (!t.isObjectExpression(value)) {
			throw new RuntimeError(value, `Method ${JSON.stringify(curMethodName)} required ${num} argument to be an object`);
		}
		break;

	case 'array':
		if (!t.isArrayExpression(value)) {
			throw new RuntimeError(value, `Method ${JSON.stringify(curMethodName)} required ${num} argument to be an array`);
		}
		break;

	case 'number':
		if (!t.isNumericLiteral(value)) {
			throw new RuntimeError(value, `Method ${JSON.stringify(curMethodName)} required ${num} argument to be a number`);
		}
		break;

	case 'string':
		if (!t.isStringLiteral(value)) {
			throw new RuntimeError(value, `Method ${JSON.stringify(curMethodName)} required ${num} argument to be a string`);
		}
		break;

	case 'boolean':
		if (!t.isBooleanLiteral(value)) {
			throw new RuntimeError(value, `Method ${JSON.stringify(curMethodName)} required ${num} argument to be a boolean`);
		}
		break;

	default:
		throw new AdvSyntaxError(value, `Unknown argument type: ${JSON.stringify(type)}`);
	}
}

function firstType(value, type) {
	return argType('first', value, type);
}

function firstObject(value) {
	return firstType(value, 'object');
}

function firstArray(value) {
	return firstType(value, 'array');
}

function firstString(value) {
	return firstType(value, 'string');
}

function firstNumber(value) {
	return firstType(value, 'number');
}

function firstBoolean(value) {
	return firstType(value, 'boolean');
}

function oneArg(args, schema = {}) {
	if (args.length !== 1) {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} required one argument`);
	}
}

function atLeastOne(args, schema = {}) {
	if (args.length === 0) {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} required at least one argument`);
	}
}

function maxTwo(args, schema = {}) {
	if (args.length > 2) {
		throw new RuntimeError(schema, `Method ${JSON.stringify(curMethodName)} accept only two arguments`);
	}
}

function objectOrTwo(args, schema) {
	atLeastOne(args, schema);
	maxTwo(args, schema);

	const first = args[0];

	if (args.length === 1) {
		if (!t.isObjectExpression(first)) {
			if (t.isStringLiteral(first)) {
				throw new RuntimeError(first, `Method ${JSON.stringify(curMethodName)} required two arguments`);
			}
			else {
				throw new RuntimeError(first, `Method ${JSON.stringify(curMethodName)} required first argument to be an object`);
			}
		}
	}
	else {
		if (typeof first !== 'string' && !t.isStringLiteral(first)) {
			throw new RuntimeError(first, `Method ${JSON.stringify(curMethodName)} required first argument to be a string`);
		}
	}
}

function onlyStrings(args) {
	for (const s of args) {
		if (!t.isStringLiteral(s)) {
			throw new RuntimeError(s, `Method ${JSON.stringify(curMethodName)} accept only strings`);
		}
	}
}