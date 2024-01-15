import * as PImage from "pureimage"
import { createWriteStream, createReadStream } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

// The routes that need to have an OG image generated
const routes = [{ path: "/documentation", dynamic: true }]

// Register Inter Font, located in the badge package
const InterBold = PImage.registerFont("../badge/assets/static/Inter-Bold.ttf", "Inter-Bold")

const InterMedium = PImage.registerFont("../badge/assets/static/Inter-Medium.ttf", "Inter-Medium")

// Read all routes
async function generateImages() {
	InterBold.loadSync()
	InterMedium.loadSync()

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

	const canvas = PImage.make(1200, 630)
	const ctx = canvas.getContext("2d")

	ctx.fillStyle = "#fff"
	ctx.fillRect(0, 0, 1200, 630)

	ctx.fillStyle = "#000"

	ctx.font = "72px Inter-Bold"
	ctx.fillText(item.title, 64, 128)

	// Divide the lines
	const lines = []
	let line = ""
	const words = item.description.split(" ")
	for (const word of words) {
		if (line.length + word.length > 32) {
			lines.push(line)
			line = ""
		}
		line += word + " "
	}
	lines.push(line)

	ctx.fillStyle = "#8a8a8a"

	// Write the lines
	for (const [i, line] of lines.entries()) {
		ctx.font = "48px Inter-Medium"
		ctx.fillText(line, 64, 210 + i * 64)
	}

	ctx.fillStyle = "#0891b2"

	ctx.font = "32px Inter-Medium"

	ctx.fillText(`/documentation/${item.slug}`, 64, 630 - 64)

	// Add the logo
	const logo = await PImage.decodePNGFromStream(
		createReadStream(
			new URL("inlang/source-code/website/public/images/inlang-advanced.png", repositoryRoot)
		)
	)

	ctx.drawImage(logo, 1200 - 24 - 256, 24, 256, 256)

	await PImage.encodeJPEGToStream(
		canvas,
		createWriteStream(
			path.join(
				outputPath,
				`${item.title.toLowerCase().replaceAll(" ", "_").replaceAll("?", "")}.jpg`
			)
		)
	)

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
