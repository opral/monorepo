import type { $ImportError } from "@inlang/environment"
import type { InlangConfig } from "@inlang/config"

type PluginErrorOptions = {
	module: InlangConfig["plugins"][number]["module"]
} & Partial<Error>

export class PluginError extends Error {
	public readonly module: string

	constructor(message: string, options: PluginErrorOptions) {
		super(message)
		this.name = "PluginError"
		this.module = options.module
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

export class PluginUsesUnavailableApiError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginIncorrectlyDefinedUsedApisError"
	}
}

export class PluginIncorrectlyDefinedUsedApisError extends PluginError {
	constructor(message: string, options: PluginErrorOptions) {
		super(message, options)
		this.name = "PluginIncorrectlyDefinedUsedApisError"
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
