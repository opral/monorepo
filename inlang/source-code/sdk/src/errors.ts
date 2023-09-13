export class InvalidConfigError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "InvalidConfigError"
	}
}

export class ProjectFileJSONSyntaxError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ProjectFileJSONSyntaxError"
	}
}

export class ProjectFilePathNotFoundError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ProjectFilePathNotFoundError"
	}
}

export class PluginSaveMessagesError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "PluginSaveMessagesError"
	}
}

export class PluginLoadMessagesError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "PluginLoadMessagesError"
	}
}
