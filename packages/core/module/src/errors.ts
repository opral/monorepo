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
 * Error when a module does not export any plugins or lint rules.
 */
export class ModuleHasNoExportsError extends ModuleError {
	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message, options)
		this.name = "ModuleHasNoExportsError"
	}
}

/**
 * Error when a module cannot be imported.
 */
export class ModuleImportError extends ModuleError {
	constructor(message: string, options: { module: string; cause: Error }) {
		super(message, options)
		this.name = "ModuleImportError"
	}
}
