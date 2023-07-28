export class InvalidConfigError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "InvalidConfigError"
	}
}
