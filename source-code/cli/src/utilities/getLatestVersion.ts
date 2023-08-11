import fetch from "node-fetch"

export async function getLatestVersion(packageName: string, singleDigit = true): Promise<string | undefined> {
	const response = await fetch(`https://registry.npmjs.org/${packageName}`)
	const metadata = (await response.json()) as { "dist-tags": { latest: string } }
	const latestVersion = metadata["dist-tags"]?.latest

	if (latestVersion) {
		// Extract the major version with a single digit
		const majorVersion = latestVersion.split(".")[0]
		return singleDigit ? majorVersion : latestVersion
	} else {
		return "latest"
	}
}
