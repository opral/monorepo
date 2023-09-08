export * from "./plugins/errors.js"
export * from "./message-lint-rules/errors.js"

export class ModuleError extends Error {
	public readonly Module: string
	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.name = "ModuleError"
		this.Module = options.module
		this.cause = options.cause
	}
}

/**
 * Error when a Module does not export any plugins or lint rules.
 */
export class ModuleHasNoExportsError extends ModuleError {
	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message, options)
		this.name = "ModuleHasNoExportsError"
	}
}

/**
 * Error when a Module cannot be imported.
 */
export class ModuleImportError extends ModuleError {
	constructor(message: string, options: { module: string; cause: Error }) {
		super(message, options)
		this.name = "ModuleImportError"
	}
}

export class ModuleExportIsInvalidError extends ModuleError {
	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message, options)
		this.name = "ModuleExportIsInvalidError"
	}
}
