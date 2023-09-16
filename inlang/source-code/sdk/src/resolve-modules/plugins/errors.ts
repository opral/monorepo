import type { Plugin } from "@inlang/plugin"

type PluginErrorOptions = {
	plugin: Plugin["id"]
} & Partial<Error>

class PluginError extends Error {
	public readonly plugin: string

	constructor(message: string, options: PluginErrorOptions) {
		super(message)
		this.name = "PluginError"
		this.plugin = options.plugin
	}
}

export class PluginHasInvalidIdError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginHasInvalidIdError"
	}
}

export class PluginUsesReservedNamespaceError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginUsesReservedNamespaceError"
	}
}

export class PluginHasInvalidSchemaError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginHasInvalidSchemaError"
	}
}

export class PluginLoadMessagesFunctionAlreadyDefinedError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginLoadMessagesFunctionAlreadyDefinedError"
	}
}

export class PluginSaveMessagesFunctionAlreadyDefinedError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginSaveMessagesFunctionAlreadyDefinedError"
	}
}

export class PluginReturnedInvalidCustomApiError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginReturnedInvalidCustomApiError"
	}
}

export class PluginsDoNotProvideLoadOrSaveMessagesError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginsDoNotProvideLoadOrSaveMessagesError"
		options.plugin = "plugin.inlang.missing"
	}
}
