const t = require('@babel/types');
const AdvSyntaxError = require('./AdvSyntaxError');

module.exports = getObjectName;

function getObjectName(root) {
	if (t.isNullLiteral(root)) {
		return 'null';
	}

	if (t.isBinaryExpression(root)) {
		return minusExpressionToObjectName(root);
	}

	var name = '';

	var add = function (node, parent) {
		if (t.isMemberExpression(node)) {
			let {object, property} = node;

			add(object, parent);
			add(property, node);
		}
		else if (t.isIdentifier(node)) {
			name += (parent ? '.' : '') + node.name;
		}
		else {
			throw new AdvSyntaxError(node, `Invalid reference type: ${node.type}`);
		}
	};

	add(root);

	return name;
}

function minusExpressionToObjectName(root) {
	var items = [];

	var add = function (node) {
		var {left, right, operator} = node;

		if (operator !== '-') {
			throw new AdvSyntaxError(node, `Invalid binary operator: ${JSON.stringify(operator)}`);
		}

		var check = function (item) {
			if (t.isIdentifier(item)) {
				items.push(item.name);
			}
			else if (t.isBinaryExpression(item)) {
				add(item);
			}
			else {
				throw new AdvSyntaxError(item, `Invalid binary item type: ${item.type}`);
			}
		};

		check(left);
		check(right);
	};

	add(root);

	return items.join('-');
}