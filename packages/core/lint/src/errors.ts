export class LintRuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.module = options.module
		this.name = "LintRuleError"
	}
}