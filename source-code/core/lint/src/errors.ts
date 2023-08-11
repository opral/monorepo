export class InvalidLintRuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.module = options.module
		this.name = "LintRuleError"
	}
}

/**
 * Error when a lint rule throws during the linting process.
 */
export class LintRuleThrowedError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = "LintRuleThrowedError"
	}
}
