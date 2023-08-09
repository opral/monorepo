export class InvalidConfigError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "InvalidConfigError"
	}
}

export class ConfigSyntaxError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ConfigSyntaxError"
	}
}

export class ConfigPathNotFoundError extends Error {
	constructor(message: string, options: ErrorOptions) {
		super(message, options)
		this.name = "ConfigPathNotFoundError"
	}
}
