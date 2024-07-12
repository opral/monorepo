export * from "../../resolve-modules/plugins/errors.js"
export * from "../../resolve-modules/message-lint-rules/errors.js"

export class ModuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.name = "ModuleError"
		this.module = options.module
		this.cause = options.cause
	}
}

/**
 * Error when a Module cannot be imported.
 */
export class ModuleImportError extends ModuleError {
	constructor(options: { module: string; cause: Error }) {
		super(`Couldn't import the plugin "${options.module}":\n\n${options.cause}`, options)
		this.name = "ModuleImportError"
	}
}
