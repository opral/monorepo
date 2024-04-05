import satori from "satori"
import { openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { publicEnv } from "@inlang/env-variables"
import { markup } from "./helper/markup.js"
import { readFileSync } from "node:fs"
import { removeCommas } from "./helper/removeCommas.js"
import { calculateSummary } from "./helper/calculateSummary.js"
import { caching } from "cache-manager"
import { loadProject } from "@inlang/sdk"

const fontMedium = readFileSync(new URL("../assets/static/Inter-Medium.ttf", import.meta.url))
const fontBold = readFileSync(new URL("../assets/static/Inter-Bold.ttf", import.meta.url))

const cache = await caching("memory", {
	ttl: 1000 * 60 * 60 * 24 * 1, // 1 day,
	sizeCalculation: () => 40000, // approx 40kb per badge
	maxSize: 1000 * 1000 * 1000 * 0.25, // 250 MB
})

const errorCache = await caching("memory", {
	ttl: 1000 * 60 * 60 * 2, // 2 hours,
	sizeCalculation: () => 1000,
	maxSize: 1000 * 1000 * 1000 * 0.25, // 250 MB
})

export const badge = async (urlQuery: string, projectQuery?: string) => {
	const fromCache = (await cache.get(urlQuery)) as string | undefined

	if (fromCache) {
		return fromCache
	}

	const fromErrorCache = (await errorCache.get(urlQuery)) as string | undefined
	if (fromErrorCache) {
		console.warn("Skipping due to cached error", urlQuery)
		throw fromErrorCache
	}

	try {
		// initialize a lix repo instance on each request to prevent cross request pollution
		const repo = await openRepository(`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/git/${urlQuery}`, {
			nodeishFs: createNodeishMemoryFs(),
		})

		const project = await loadProject({
			projectPath: projectQuery ?? "/project.inlang",
			repo,
			appId: "app.inlang.badge",
		})

		// access all messages via inlang instance query
		const messageIds = project.query.messages.includedMessageIds()

		const settings = project.settings()

		const reports = await project.query.messageLintReports.getAll()

		const { percentage, errors, warnings, numberOfMissingVariants } = calculateSummary({
			reports: reports,
			languageTags: settings.languageTags,
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
			}
		)

		await cache.set(urlQuery, image)

		// TODO: additional badge telemetry event?
		// telemetryNode.capture({
		// 	event: "BADGE created",
		// 	groups: { repository: gitOrigin },
		// 	distinctId: "unknown",
		// })
		return image
	} catch (error) {
		await errorCache.set(urlQuery, error)
		throw error
	}
}
