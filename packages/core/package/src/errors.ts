export class PackageError extends Error {
	public readonly package: string
	constructor(message: string, options: { package: string; cause?: Error }) {
		super(message)
		this.name = "PackageError"
		this.package = options.package
		this.cause = options.cause
	}
}

/**
 * Error when a package does not export any plugins or lint rules.
 */
export class PackageHasNoExportsError extends PackageError {
	constructor(message: string, options: { package: string; cause?: Error }) {
		super(message, options)
		this.name = "PackageHasNoExportsError"
	}
}

/**
 * Error when a package cannot be imported.
 */
export class PackageImportError extends PackageError {
	constructor(message: string, options: { package: string; cause: Error }) {
		super(message, options)
		this.name = "PackageImportError"
	}
}
