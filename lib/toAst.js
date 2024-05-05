const parser = require('@babel/parser');

/**
 * @param {function|Object|string} code
 * @param {import('@babel/parser').ParserOptions} [params]
 * @returns {import('../index').ADV_AST}
 */
module.exports = function toAst(code, {sourceFilename, startLine, startColumn} = {}) {
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
		return parser.parseExpression(code, {sourceFilename, startLine, startColumn});
	}
	catch (err) {
		err.type = err.code;
		err.code = code;
		err.filename = sourceFilename;

		throw err;
	}
};