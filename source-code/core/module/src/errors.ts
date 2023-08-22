export class ModuleError extends Error {
	public readonly module: string
	constructor(message: string, options: { module: string; cause?: Error }) {
		super(message)
		this.name = "ModuleHasNoExportsError"
		this.module = options.module
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
/**
 * Error when no module provides the API to handle messages.
 */
export class NoMessagesPluginError extends Error {
	constructor() {
		super("It seems you did not install any plugin that handles messages. Please add one to make inlang work. See https://inlang.com/documentation/plugins/registry.") // TODO: check if link is correct
		this.name = "NoMessagesPluginError"
	}
}
