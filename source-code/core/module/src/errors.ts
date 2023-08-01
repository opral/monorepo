import type { $ImportError } from "@inlang/environment"

/**
 * Error thrown when a module cannot be imported.
 */

export class ModuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string; cause: Error }) {
		super(message)
		this.name = "ModuleError"
		this.module = options.module
	}
}

export class ModuleImportError extends ModuleError {
	constructor(message: string, options: { module: string; cause: $ImportError }) {
		super(message, options)
		this.name = "ModuleImportError"
	}
}
