/**
 * Error thrown when the $import function fails.
 *
 * Dedicated class to make it easier to identify this error.
 */
export class $ImportError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "$ImportError"
	}
}
