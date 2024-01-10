import { createCanvas, registerFont } from "canvas"
import { createWriteStream } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

// The routes that need to have an OG image generated
const routes = [{ path: "/documentation", dynamic: true }]

// Register Inter Font, located in the badge package
registerFont("../badge/assets/static/Inter-Bold.ttf", {
	family: "Inter",
	weight: "bold",
})

registerFont("../badge/assets/static/Inter-Medium.ttf", {
	family: "Inter",
	weight: "medium",
})

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
				const outputDirectory = path.join(".", "public", "opengraph", "generated")

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
				const outputDirectory = path.join(".", "public", "opengraph", "generated")

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
	const lastWordIndex = item.slug.lastIndexOf("/")
	const slug = item.slug.includes("/") ? item.slug.slice(0, lastWordIndex) : undefined

	const outputPath = slug
		? path.join(outputDirectory, item.slug.slice(0, lastWordIndex))
		: path.join(outputDirectory, item.slug)

	await ensureDirectoryExists(outputPath)

	const canvas = createCanvas(1200, 630)
	const ctx = canvas.getContext("2d")

	// Give the image a white background
	ctx.fillStyle = "#fff"
	ctx.fillRect(0, 0, 1200, 630)

	ctx.fillStyle = "#000"

	ctx.font = "bold 48px Inter"
	ctx.fontWeight = "bold"
	ctx.fillText(item.title, 64, 80)

	ctx.fillStyle = "#8a8a8a"

	ctx.font = "32px Inter"
	ctx.fontWeight = "medium"
	ctx.fillText(
		// if description is longer than 60 characters, cut it off and add ellipsis
		item.description.length > 60 ? item.description.slice(0, 60) + "..." : item.description,
		64,
		128
	)

	const out = createWriteStream(
		path.join(outputPath, `${item.title.toLowerCase().replaceAll(" ", "_")}.jpg`)
	)
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
