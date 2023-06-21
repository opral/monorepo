import { log } from "../utilities.js"

export async function getLatestVersion(packageName: string): Promise<string | undefined> {
	try {
		const response = await fetch(`https://registry.npmjs.org/${packageName}`)
		const metadata = await response.json()
		return metadata["dist-tags"].latest
	} catch (error) {
		log.error(`Failed to retrieve the latest version for ${packageName}:`, error)
		return undefined
	}
}
