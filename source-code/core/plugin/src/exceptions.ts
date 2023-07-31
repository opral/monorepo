import type { $ImportError } from "@inlang/environment"
import type { InlangConfig } from "@inlang/config"
import type { Plugin } from "./api.js"

// TODO rename to error

type PluginExceptionOptions = {
	module: InlangConfig["plugins"][number]["module"]
} & Partial<Error>

export class PluginException extends Error {
	public readonly module: string

	constructor(message: string, options: PluginExceptionOptions) {
		super(message)
		this.name = "PluginException"
		this.module = options.module
	}
}

/**
 * Error thrown when a plugin cannot be imported.
 */
export class PluginImportException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions & { cause: $ImportError }) {
		super(message, options)
		this.name = "PluginImportException"
	}
}

export class PluginInvalidIdException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions) {
		super(message, options)
		this.name = "PluginInvalidIdException"
	}
}

export class PluginUsesInvalidApiException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions) {
		super(message, options)
		this.name = "PluginUsesInvalidApiException"
	}
}

export class PluginUsesReservedNamespaceException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions) {
		super(message, options)
		this.name = "PluginUsesReservedNamespaceException"
	}
}

export class PluginApiAlreadyDefinedException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions) {
		super(message, options)
		this.name = "PluginApiAlreadyDefinedException"
	}
}

export class PluginFunctionLoadMessagesAlreadyDefinedException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions) {
		super(message, options)
		this.name = "PluginFunctionLoadMessagesAlreadyDefinedException"
	}
}

export class PluginFunctionSaveMessagesAlreadyDefinedException extends PluginException {
	constructor(message: string, options: PluginExceptionOptions) {
		super(message, options)
		this.name = "PluginFunctionSaveMessagesAlreadyDefinedException"
	}
}
