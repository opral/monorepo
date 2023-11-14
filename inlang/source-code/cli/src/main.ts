import semver from "semver"
import { Command } from "commander"
import { machine } from "./commands/machine/index.js"
import { module } from "./commands/module/index.js"
import { version } from "../package.json"
import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"
import { open } from "./commands/open/index.js"
import { gitOrigin, telemetry } from "./services/telemetry/implementation.js"
import fetchPolyfill from "node-fetch"
import { lint } from "./commands/lint/index.js"
import { project } from "./commands/project/index.js"
import { execSync } from "node:child_process"
// --------------- INIT ---------------

// polyfilling node < 18 with fetch
// see https://github.com/osmosis-labs/osmosis-frontend/pull/1575#pullrequestreview-1434480086
if (typeof fetch === "undefined") {
	globalThis.fetch = fetchPolyfill as any
}

initErrorMonitoring()
// checks whether the gitOrigin corresponds to the pattern
// beautiful logging
;(consola as unknown as Consola).wrapConsole()

// --------------- CLI ---------------

export const cli = new Command()
	// Settings
	.name("inlang")
	.version(version)
	.description("CLI for inlang.")
	// Commands
	.addCommand(project)
	.addCommand(lint)
	.addCommand(machine)
	.addCommand(open)
	.addCommand(module)
	// Hooks
	.hook("preAction", (command) => {
		// name enables better grouping in the telemetry dashboard
		const name = command.args.filter(
			// shouldn't start with a flag and the previous arg shouldn't be a flag
			(arg, i) => !arg.startsWith("-") && !command.args[i - 1]?.startsWith("-")
		)
		telemetry.capture({
			event: `CLI command executed`,
			properties: {
				name: name.join(" "),
				args: command.args.join(" "),
			},
		})
		// Check for the latest version and notify if there's a major version update
		const latestVersion = getLatestVersion()
		const currentVersion = getCurrentVersion()
		if (latestVersion && currentVersion) {
			if (isMajorVersionUpdate(currentVersion, latestVersion)) {
				console.info(`A major update to (${latestVersion}) is available.`)
				// Prompt the user to update
				const userResponse = prompt("Do you want to update to the latest version? (yes/no)")
				if (userResponse?.toLowerCase().includes("y")) {
					console.info("Updating to the latest...")
					updateToLatest(true)
				} else {
					console.info("Continuing with the current version...")
				}
			} else {
				// Check for the latest minor version and update automatically in the background
				updateToLatest()
			}
		}
	})

// --------------- TELEMETRY ---------------

// not using await to not block the CLI

telemetry.capture({
	event: "CLI started",
	properties: {
		version,
	},
})
telemetry.groupIdentify({
	groupType: "repository",
	groupKey: gitOrigin,
	properties: {
		name: gitOrigin,
	},
})

// --------------- UPDATE UTILS ---------------

// A function to check if there's a major version update
export function isMajorVersionUpdate(currentVersion: string, latestVersion: string): boolean {
	return semver.major(currentVersion) !== semver.major(latestVersion)
}

// Function to get the current version by executing "npx @inlang/cli --version"
export function getCurrentVersion(): string | void {
	try {
		const output = execSync("npx @inlang/cli --version", { encoding: "utf-8" })
		// Extract the version from the output (it's in the format "X.Y.Z")
		if (output) return output.trim()
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
	}
}

// Function to get the latest version from the npm registry
export function getLatestVersion(): string | void {
	try {
		const output = execSync("npm show @inlang/cli version", { encoding: "utf-8" })
		if (output) return output.trim()
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
	}
}

// Function to update to the latest minor version in the background
export function updateToLatest(show: boolean = false): void {
	try {
		// Execute the update command in the background
		execSync("npm i -g @inlang/cli@latest", { stdio: "ignore" })
		if (show) console.info("Updated @inlang/cli to the latest.")
	} catch (error) {
		if (show) {
			console.error("Failed to update @inlang/cli to the latest.")
			console.error(error instanceof Error ? error.message : error)
		}
	}
}
