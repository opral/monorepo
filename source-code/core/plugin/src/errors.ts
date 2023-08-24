import type { Plugin } from "./api.js"

type PluginErrorOptions = {
	plugin: Plugin["meta"]["id"]
} & Partial<Error>

class PluginError extends Error {
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
export class PluginUsesInvalidIdError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginUsesInvalidIdError"
	}
}

export class PluginUsesReservedNamespaceError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginUsesReservedNamespaceError"
	}
}

export class PluginUsesInvalidSchemaError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginUsesInvalidSchemaError"
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

export class PluginFunctionDetectLanguageTagsAlreadyDefinedError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginFunctionDetectLanguageTagsAlreadyDefinedError"
	}
}

export class PluginReturnedInvalidAppSpecificApiError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginReturnedInvalidAppSpecificApiError"
	}
}
