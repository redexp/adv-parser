class RuntimeError extends Error {
	constructor(node, message) {
		super(message);
		this.loc = node.loc;
	}
}

module.exports = RuntimeError;