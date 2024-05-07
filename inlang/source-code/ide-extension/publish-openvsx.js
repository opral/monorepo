/* eslint-disable */

import { execSync } from "node:child_process"
import path from "node:path"
import packageJson from "./package.json" assert { type: "json" }

// Ensure environment variables are checked properly
if (!process.env.OPEN_VSX_TOKEN) {
	throw new Error("OPEN_VSX_TOKEN is not defined.")
}

const version = packageJson.version
const vsixFileName = `vs-code-extension-${version}.vsix`
const vsixFilePath = path.join(__dirname, vsixFileName)
const token = process.env.OPEN_VSX_TOKEN

try {
	const command = `npx ovsx publish "${vsixFilePath}" -p ${token} --namespace inlang`
	console.log(`Executing: ${command}`)
	execSync(command, { stdio: "inherit" })
	console.log(`Successfully published ${vsixFileName} to Open VSX Registry.`)
} catch (error) {
	console.error(`Failed to publish to Open VSX: ${error.message}`)
	process.exit(1)
}
