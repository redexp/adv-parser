class AdvReferenceError extends ReferenceError {
	constructor(name, node, message) {
		super(message || `Unknown reference: ${JSON.stringify(name)}`);
		this.referenceName = name;
		this.loc = node.loc;
	}
}

module.exports = AdvReferenceError;