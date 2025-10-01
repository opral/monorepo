import * as vscode from "vscode"

/**
 * Centralized logger for the Sherlock VS Code extension.
 *
 * Messages are written to both the developer console and a dedicated VS Code output channel.
 *
 * @example
 * logger.info("Sherlock activated", { workspace: workspaceFolder.uri.fsPath })
 */
export const logger = {
	debug: (message: string, ...details: unknown[]) => write("DEBUG", message, details),
	info: (message: string, ...details: unknown[]) => write("INFO", message, details),
	warn: (message: string, ...details: unknown[]) => write("WARN", message, details),
	error: (message: string, ...details: unknown[]) => write("ERROR", message, details),
}

const outputChannel =
	typeof vscode.window?.createOutputChannel === "function"
		? vscode.window.createOutputChannel("Sherlock")
		: undefined

const isTestEnvironment = (() => {
	try {
		if (typeof process === "undefined") {
			return false
		}

		return (
			process.env.NODE_ENV === "test" ||
			process.env.VITEST === "true" ||
			Boolean(process.env.VITEST)
		)
	} catch (error) {
		return false
	}
})()

function write(
	level: "DEBUG" | "INFO" | "WARN" | "ERROR",
	message: string,
	details: unknown[]
): void {
	const timestamp = new Date().toISOString()
	const serializedDetails = serialize(details)
	const entry = `[${timestamp}] [${level}] ${message}${serializedDetails ? ` ${serializedDetails}` : ""}`

	if (outputChannel) {
		outputChannel.appendLine(entry)
	}

	if (isTestEnvironment) {
		return
	}

	const consoleMethod = getConsoleMethod(level)
	consoleMethod(`[Sherlock][${level}] ${message}`, ...details)
}

function getConsoleMethod(level: "DEBUG" | "INFO" | "WARN" | "ERROR") {
	switch (level) {
		case "ERROR":
			return console.error
		case "WARN":
			return console.warn
		case "DEBUG":
			return console.debug ?? console.log
		default:
			return console.log
	}
}

function serialize(details: unknown[]): string {
	if (details.length === 0) {
		return ""
	}

	return details
		.map((detail) => {
			if (typeof detail === "string") {
				return detail
			}

			try {
				return JSON.stringify(detail, null, 2)
			} catch (error) {
				return String(detail)
			}
		})
		.join(" ")
}
