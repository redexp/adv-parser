const parser = require('@babel/parser');

/**
 * @param {function|Object|string} code
 * @returns {import('../index').ADV_AST}
 */
module.exports = function toAst(code) {
	if (typeof code === 'function') {
		code = code.toString();
	}

	if (code && typeof code === 'object') {
		code = JSON.stringify(code);
	}

	if (code.includes('#')) {
		code = code.replace(/^(\s*)#/gm, '$1//');
	}

	try {
		return parser.parseExpression(code);
	}
	catch (err) {
		err.type = err.code;
		err.code = code;

		throw err;
	}
};