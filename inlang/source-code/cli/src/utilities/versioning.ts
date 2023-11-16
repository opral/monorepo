import semver from "semver"
import { execSync, spawnSync } from "node:child_process"

export function isMajorVersionUpdate(currentVersion: string, latestVersion: string): boolean {
	return semver.major(currentVersion) !== semver.major(latestVersion)
}

export function getCurrentVersion(): string | void {
	try {
		const output = execSync("npm list -g @inlang/cli", { encoding: "utf8", stdio: "pipe" })
		// If the package is installed, extract the version and return it
		const versionMatch = output.match(/@inlang\/cli@(\d+\.\d+\.\d+)/)
		if (versionMatch && versionMatch[1]) {
			return versionMatch[1]
		}
	} catch (error) {
		/* pass */
	}
	// If the package is not found in the global list, return "0.0.0"
	return "0.0.0"
}

export function getLatestVersion(): string | void {
	try {
		const output = spawnSync("npm", ["show", "@inlang/cli", "version"])
		if (output) return output.stdout.toString().trim()
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
	}
}

export function updateToLatest(show: boolean = false): void {
	try {
		// Execute the update command in the background
		spawnSync("npm", ["i", "-g", "@inlang/cli@latest"])
		if (show) console.info("Updated @inlang/cli to the latest.")
	} catch (error) {
		if (show) {
			console.error("Failed to update @inlang/cli to the latest.")
			console.error(error instanceof Error ? error.message : error)
		}
	}
}
