import { log } from "../utilities.js"

export async function getLatestVersion(packageName: string): Promise<string | undefined> {
	try {
		const response = await fetch(`https://registry.npmjs.org/${packageName}`)
		const metadata = await response.json()
		const latestVersion = metadata["dist-tags"].latest

		// Extract the major version with a single digit
		const majorVersion = latestVersion.split(".")[0]

		return majorVersion
	} catch (error) {
		log.error(`Failed to retrieve the latest version for ${packageName}:`, error)
		return undefined
	}
}
