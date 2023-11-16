import { expect, test, vi } from "vitest"
import { spawnSync, execSync } from "node:child_process"
import {
	getCurrentVersion,
	getLatestVersion,
	isMajorVersionUpdate,
	updateToLatest,
} from "./versioning.js"

// Mock prompt implementation
const prompt = vi
	.fn()
	.mockImplementation(
		(clackMessage, clackOptions, response) => new Promise((resolve) => resolve(response))
	)

const uninstallGlobal = () => spawnSync("npm", ["uninstall", "-g", "@inlang/cli"])

const installGlobal = (version: string) =>
	execSync("npm install -g @inlang/cli@" + version, { encoding: "utf8", stdio: "pipe" })

test("if the install global package command installs correctly", async () => {
	// Make sure that the package does not exist
	uninstallGlobal()

	// Install a lower version of the package
	installGlobal("1.0.0")

	// Match the version with the one installed in this particular test
	expect(getCurrentVersion()).toBe("1.0.0")
})

test("if major update is available, user chooses to update", async () => {
	// Make sure that the package does not exist
	uninstallGlobal()

	// Install an older version of the package
	installGlobal("0.8.0")

	// Run the CLI
	// Check for the latest version and notify if there's a major version update
	const latestVersion = getLatestVersion()
	const currentVersion = getCurrentVersion()

	// Match the version with the one installed in this particular test
	expect(getCurrentVersion()).toBe("0.8.0")

	if (latestVersion && currentVersion) {
		if (isMajorVersionUpdate(currentVersion, latestVersion)) {
			console.info(`A major update to ${latestVersion} is available.`)
			const userResponse = await prompt(
				`Do you want to update to the latest version?`,
				{
					initial: true,
					type: "confirm",
				},
				true
			)
			if (userResponse === true) {
				console.info("Updating to the latest...")
				updateToLatest(true)
				// Match the version with the one installed in this particular test
				expect(getCurrentVersion()).toBe("1.20.0")
			} else {
				console.info("Continuing with the current version...")
			}
		} else {
			updateToLatest()
		}
	}
})

test("if major update is available, user chooses not to update", async () => {
	// Make sure that the package does not exist
	uninstallGlobal()

	// Install an older version of the package
	installGlobal("0.8.0")

	// Run the CLI
	// Check for the latest version and notify if there's a major version update
	const latestVersion = getLatestVersion()
	const currentVersion = getCurrentVersion()

	// Match the version with the one installed in this particular test
	expect(getCurrentVersion()).toBe("0.8.0")

	if (latestVersion && currentVersion) {
		if (isMajorVersionUpdate(currentVersion, latestVersion)) {
			console.info(`A major update to ${latestVersion} is available.`)
			const userResponse = await prompt(
				`Do you want to update to the latest version?`,
				{
					initial: true,
					type: "confirm",
				},
				false
			)
			if (userResponse === true) {
				console.info("Updating to the latest...")
				updateToLatest(true)
			} else {
				console.info("Continuing with the current version...")
				// Match the version with the one installed in this particular test
				expect(getCurrentVersion()).toBe("0.8.0")
			}
		} else {
			updateToLatest()
		}
	}
})

test("if minor update is available, the version is updated in the background", async () => {
	// Make sure that the package does not exist
	uninstallGlobal()

	// Install an older version of the package
	installGlobal("1.19.0")

	// Run the CLI
	// Check for the latest version and notify if there's a major version update
	const latestVersion = getLatestVersion()
	const currentVersion = getCurrentVersion()

	// Match the version with the one installed in this particular test
	expect(getCurrentVersion()).toBe("1.19.0")

	if (latestVersion && currentVersion) {
		if (isMajorVersionUpdate(currentVersion, latestVersion)) {
			console.info(`A major update to ${latestVersion} is available.`)
			const userResponse = await prompt(
				`Do you want to update to the latest version?`,
				{
					initial: true,
					type: "confirm",
				},
				false
			)
			if (userResponse === true) {
				console.info("Updating to the latest...")
				updateToLatest(true)
			} else {
				console.info("Continuing with the current version...")
			}
		} else {
			updateToLatest()
			// Match the version with the one installed in this particular test
			expect(getCurrentVersion()).toBe("1.20.0")
		}
	}
})
