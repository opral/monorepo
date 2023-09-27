import fs from "node:fs/promises"
import fetch from "node-fetch"

const registryData = await fs.readFile("registry.json", "utf8")
const registry = JSON.parse(registryData)

const purgeArray = []

for (const line of registry) {
	if (line.includes("marketplace-manifest.json")) {
		// Remove "https://cdn.jsdelivr.net" from the line and add to purgeArray
		const lineWithoutCDN = line.replace("https://cdn.jsdelivr.net", "")
		purgeArray.push(lineWithoutCDN)

		// Add other CDN files to purgeArray
		const manifestFile = await fetch(line)
		const manifest = await manifestFile.json()
		purgeArray.push(manifest.readme.en.replace("https://cdn.jsdelivr.net", ""))

		if (manifest.gallery) {
			for (const image of manifest.gallery) {
				if (image) purgeArray.push(image.replace("https://cdn.jsdelivr.net", ""))
			}
		}
	}
}

const jsonString = JSON.stringify(purgeArray)


const apiUrl = "https://purge.jsdelivr.net/"
const requestData = JSON.stringify({ path: JSON.parse(jsonString) })

// eslint-disable-next-line no-undef
await fetch(apiUrl, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: requestData,
})
	.then((response) => response.text())
	/* Log the data to see status of the purge */
	.then((data) => {
		// eslint-disable-next-line no-undef, no-console
		console.log(data)
	})
	.catch((error) => {
		// eslint-disable-next-line no-undef
		console.error(error)
	})
