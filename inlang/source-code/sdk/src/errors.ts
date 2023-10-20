import type { ValueError } from "@sinclair/typebox/errors"

export class LoadProjectInvalidArgument extends Error {
	constructor(message: string, options: { argument: string }) {
		super(`The argument "${options.argument}" of loadProject() is invalid: ${message}`)
		this.name = "LoadProjectInvalidArgument"
	}
}

export class ProjectSettingsInvalidError extends Error {
	constructor(options: { errors: ValueError[] }) {
		// TODO: beatufiy ValueErrors
		super(
			`The project settings are invalid:\n\n${options.errors
				.filter((error) => error.path)
				.map((error) => `"${error.path}":\n\n${error.message}`)
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
