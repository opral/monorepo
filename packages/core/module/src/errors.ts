import type { $ImportError } from "@inlang/environment"
import type { Plugin } from "@inlang/plugin"

// TODO rename to error

type PluginErrorOptions = {
	plugin: Plugin["meta"]["id"]
} & Partial<Error>

/**
 * Error thrown when a module cannot be imported.
 */

export class ModuleError extends Error {
	public readonly module: string

	constructor(message: string, options: { module: string, cause: Error }) {
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

export class PluginError extends Error {
	public readonly plugin: string

	constructor(message: string, options: PluginErrorOptions) {
		super(message)
		this.name = "PluginError"
		this.plugin = options.plugin
	}
}
