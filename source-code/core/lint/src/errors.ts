export class InvalidLintRuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.module = options.module
		this.name = "LintRuleError"
	}
}
export class LintError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = "LintError"
	}
}
