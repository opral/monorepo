import type { $ImportError } from "@inlang/environment"
import type { Plugin } from "./api.js"

// TODO rename to error

type PluginErrorOptions = {
	plugin: Plugin["meta"]["id"]
} & Partial<Error>

export class PluginError extends Error {
	public readonly plugin: string

	constructor(message: string, options: PluginErrorOptions) {
		super(message)
		this.name = "PluginError"
		this.plugin = options.plugin
	}
}

/**
 * Error thrown when a plugin cannot be imported.
 */
export class PluginImportError extends PluginError {
	constructor(message: string, options: PluginErrorOptions & { cause: $ImportError }) {
		super(message, options)
		this.name = "PluginImportError"
	}
}

export class PluginInvalidIdError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginInvalidIdError"
	}
}

export class PluginUsesInvalidApiError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginUsesInvalidApiError"
	}
}

export class PluginUsesReservedNamespaceError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginUsesReservedNamespaceError"
	}
}

export class PluginApiAlreadyDefinedError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginApiAlreadyDefinedError"
	}
}

export class PluginFunctionLoadMessagesAlreadyDefinedError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginFunctionLoadMessagesAlreadyDefinedError"
	}
}

export class PluginFunctionSaveMessagesAlreadyDefinedError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginFunctionSaveMessagesAlreadyDefinedError"
	}
}

export class PluginAppSpecificApiReturnError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginAppSpecificApiReturnError"
	}
}
