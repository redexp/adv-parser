class AdvSyntaxError extends SyntaxError {
	constructor(node, message) {
		super(message || `Unknown syntax: ${node.type}`);
		this.loc = node.loc;
	}
}

module.exports = AdvSyntaxError;