import type { TelemetryEvents } from "../services/telemetry/events.js"
import { telemetry } from "../services/telemetry/implementation.js"
import * as vscode from "vscode"
import { version } from "../../package.json"

// Utility Functions
export function telemetryCapture(event: TelemetryEvents, properties?: Record<string, any>) {
	telemetry.capture({
		event,
		properties: {
			vscode_version: vscode.version,
			version,
			...properties,
		},
	})
}

export function handleError(error: any) {
	vscode.window.showErrorMessage((error as Error).message)
	console.error(error)
}
