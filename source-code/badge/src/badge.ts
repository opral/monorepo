import satori from "satori"
import { openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { markup } from "./helper/markup.js"
import { readFileSync } from "node:fs"
import { telemetryNode } from "@inlang/telemetry"
import { removeCommas } from "./helper/removeCommas.js"
import { calculateSummary } from "./helper/calculateSummary.js"
import { caching } from "cache-manager"
import { openInlangProject } from "@inlang/app"

const fontMedium = readFileSync(new URL("./assets/static/Inter-Medium.ttf", import.meta.url))
const fontBold = readFileSync(new URL("./assets/static/Inter-Bold.ttf", import.meta.url))

const cache = await caching("memory", {
	ttl: 60 * 60 * 24 * 1, // 1 day,
	sizeCalculation: () => 40000, // approx 40kb per badge
	maxSize: 1000 * 1000 * 1000 * 0.25, // 250 MB
})

export const badge = async (url: string) => {
	const fromCache = (await cache.get(url)) as string | undefined

	if (fromCache) {
		return fromCache
	}

	// initialize a lisa repo instance on each request to prevent cross request pollution
	const repo = openRepository(url, { nodeishFs: createNodeishMemoryFs() })

	// Get the content of the inlang.config.js file
	await repo.nodeishFs.readFile("./inlang.config.js", { encoding: "utf-8" }).catch((e) => {
		if (e.code !== "ENOENT") throw e
		throw new Error("No inlang.config.js file found in the repository.")
	})

	const inlang = await openInlangProject({
		projectFilePath: "./project.inlang.json",
		nodeishFs: repo.nodeishFs,
	})

	// access all messages via inlang instance query
	const messageIds = inlang.query.messages.includedMessageIds()

	const inlangConfig = inlang.config()
	// throw if no config is present
	if (!inlangConfig) {
		throw new Error("No inlang config found, please add a project.inlang.json")
	}

	// throw if no sourceLanguageTag is found
	if (!inlangConfig.sourceLanguageTag) {
		throw new Error("No sourceLanguageTag found, please add one to your project.inlang.json")
	}

	// initialize lint to access reports
	await inlang.lint.init()

	const { percentage, errors, warnings, numberOfMissingVariants } = calculateSummary({
		reports: inlang.lint.reports(),
		languageTags: inlangConfig.languageTags,
		messageIds: messageIds,
	})

	const vdom = removeCommas(markup(percentage, errors, warnings, numberOfMissingVariants))

	// render the image
	const image = await satori(
		// @ts-ignore
		vdom,
		{
			width: 340,
			height: 180,
			fonts: [
				{
					name: "Inter Medium",
					weight: 500,
					data: fontMedium,
				},
				{
					name: "Inter Bold",
					weight: 700,
					data: fontBold,
				},
			],
		},
	)

	await cache.set(url, image)
	const gitOrigin = await repo.getOrigin()

	telemetryNode.capture({
		event: "BADGE created",
		groups: { repository: gitOrigin },
		distinctId: "unknown",
	})
	telemetryNode.groupIdentify({
		groupType: "repository",
		groupKey: gitOrigin,
		properties: {
			name: gitOrigin,
		},
	})
	return image
}
