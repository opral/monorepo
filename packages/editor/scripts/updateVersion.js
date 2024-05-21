import { execSync } from "node:child_process"
import fs from "node:fs"

// Function to execute shell commands
function execCommand(command) {
	try {
		return execSync(command).toString()
	} catch (error) {
		console.error(`Error executing command: ${command}`, error)
		return undefined
	}
}

// Function to update the version.json file
function updateVersionFile() {
	// Fetch package versions
	const pnpmOutput = execCommand("pnpm m ls --depth -1 --json")
	if (!pnpmOutput) return

	const packages = JSON.parse(pnpmOutput)
	const inlangVersion = packages.find((pkg) => pkg.name === "@inlang/sdk").version
	const lixVersion = packages.find((pkg) => pkg.name === "@lix-js/client").version
	const commitHash = execCommand("git rev-parse HEAD").trim()

	// Read the current version.json
	const versionFilePath = "./version.json"
	// Create version.json if it does not exist
	if (!fs.existsSync(versionFilePath)) {
		fs.writeFileSync(
			versionFilePath,
			`{
				"@inlang/sdk": "",
				"@lix-js/client": "",
				"commit-hash": ""
			}
			`
		)
	}
	const versionFile = JSON.parse(fs.readFileSync(versionFilePath))

	// Update version.json file
	versionFile["@inlang/sdk"] = inlangVersion
	versionFile["@lix-js/client"] = lixVersion
	versionFile["commit-hash"] = commitHash

	// Write the updated version.json
	fs.writeFileSync(versionFilePath, JSON.stringify(versionFile, undefined, 2))
}

// Execute the update
updateVersionFile()
