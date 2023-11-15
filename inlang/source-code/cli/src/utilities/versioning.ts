import { execSync } from "node:child_process"
import semver from "semver"

export function isMajorVersionUpdate(currentVersion: string, latestVersion: string): boolean {
	return semver.major(currentVersion) !== semver.major(latestVersion)
}

export function getCurrentVersion(): string | void {
	try {
		const output = execSync("npx @inlang/cli --version", { encoding: "utf-8", stdio: "pipe" })
		if (output) return output.toString().trim()
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
	}
}

export function getLatestVersion(): string | void {
	try {
		const output = execSync("npm show @inlang/cli version", { encoding: "utf-8", stdio: "pipe" })
		if (output) return output.toString().trim()
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
	}
}

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
