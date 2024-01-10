import { createCanvas } from "canvas"
import { createWriteStream } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

// The routes that need to have an OG image generated
const routes = [{ path: "/documentation", dynamic: true }]

// Read all routes
async function generateImages() {
	for (const route of routes) {
		if (route.dynamic && route.path === "/documentation") {
			const sdkTableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/sdk/tableOfContents.json", repositoryRoot),
				"utf-8"
			)
			const pluginTableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/plugin/tableOfContents.json", repositoryRoot),
				"utf-8"
			)
			const lintRuleTableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/lint-rule/tableOfContents.json", repositoryRoot),
				"utf-8"
			)

			if (
				Array.isArray(JSON.parse(sdkTableOfContents)) &&
				Array.isArray(JSON.parse(pluginTableOfContents)) &&
				Array.isArray(JSON.parse(lintRuleTableOfContents))
			) {
				const tableOfContents = [
					...JSON.parse(sdkTableOfContents),
					...JSON.parse(pluginTableOfContents),
					...JSON.parse(lintRuleTableOfContents),
				]
				// Ensure the directory exists or create it
				const outputDirectory = path.join(".", "public", "opengraph", "generated")
				await ensureDirectoryExists(outputDirectory)

				for (const item of tableOfContents) {
					if (item.slug !== "") {
						writeImage(outputDirectory, item)
					}
				}
			} else {
				const tableOfContents = [
					...Object.values(JSON.parse(sdkTableOfContents)),
					...Object.values(JSON.parse(pluginTableOfContents)),
				]
				// Ensure the directory exists or create it
				const outputDirectory = path.join(".", "public", "opengraph", "generated")
				await ensureDirectoryExists(outputDirectory)

				for (const items of tableOfContents) {
					for (const item of items) {
						if (item.slug !== "") {
							writeImage(outputDirectory, item)
						}
					}
				}
			}
		}
	}
}

async function writeImage(outputDirectory, item) {
	const canvas = createCanvas(1200, 630)
	const ctx = canvas.getContext("2d")

	// Give the image a white background
	ctx.fillStyle = "#fff"
	ctx.fillRect(0, 0, 1200, 630)

	ctx.font = "bold 30px Arial"
	ctx.fillText(item.title, 0, 0)
	ctx.font = "20px Arial"
	ctx.fillText(item.description, 0, 30)

	const outputPath = path.join(outputDirectory, item.slug + ".jpg")
	const out = createWriteStream(outputPath)
	const stream = canvas.createJPEGStream()
	stream.pipe(out)

	console.info("Generated image for " + item.slug)
}

async function ensureDirectoryExists(directory) {
	try {
		await fs.access(directory)
	} catch (error) {
		// Directory doesn't exist, create it
		await fs.mkdir(directory, { recursive: true })
	}
}

generateImages()
