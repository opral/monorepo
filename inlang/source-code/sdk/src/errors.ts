import type { ValueError } from "@sinclair/typebox/errors"

export class ProjectSettingsInvalidError extends Error {
	constructor(options: { errors: ValueError[] }) {
		super(
			`The project settings are invalid:\n\n${options.errors
				.map((error) => `The value of "${error.path}" is invalid:\n\n${error.message}`)
				.join("\n")}`
		)
		this.name = "ProjectSettingsInvalidError"
	}
}

export class ProjectSettingsFileJSONSyntaxError extends Error {
	constructor(options: { cause: ErrorOptions["cause"]; path: string }) {
		super(
			`The settings file at "${options.path}" is not a valid JSON file:\n\n${options.cause}`,
			options
		)
		this.name = "ProjectSettingsFileJSONSyntaxError"
	}
}

export class ProjectSettingsFileNotFoundError extends Error {
	constructor(options: { cause?: ErrorOptions["cause"]; path: string }) {
		super(`The file at "${options.path}" could not be read. Does the file exists?`, options)
		this.name = "ProjectSettingsFileNotFoundError"
	}
}

export class PluginSaveMessagesError extends Error {
	constructor(options: { cause: ErrorOptions["cause"] }) {
		super(`An error occured in saveMessages() caused by ${options.cause}.`, options)
		this.name = "PluginSaveMessagesError"
	}
}

export class PluginLoadMessagesError extends Error {
	constructor(options: { cause: ErrorOptions["cause"] }) {
		super(`An error occured in loadMessages() caused by ${options.cause}.`, options)
		this.name = "PluginLoadMessagesError"
	}
}
