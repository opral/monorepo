export class ProjectSettingsInvalidError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ProjectSettingsInvalidError"
	}
}

export class ProjectSettingsFileJSONSyntaxError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ProjectSettingsFileJSONSyntaxError"
	}
}

export class ProjectSettingsFileNotFoundError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ProjectSettingsFileNotFoundError"
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
