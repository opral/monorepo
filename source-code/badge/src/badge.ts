import satori from "satori"
import { cloneRespository } from "./repo/clone.js"
import { getGitRemotes } from "./repo/getGitRemotes.js"
import { setupConfig } from "@inlang/core/config"
import { initialize$import, type InlangEnvironment } from "@inlang/core/environment"
import { getLintReports, lint } from "@inlang/core/lint"
import { createMemoryFs } from "@inlang-git/fs"
import { markup } from "./helper/markup.js"
import { readFileSync } from "node:fs"
import { telemetryNode, parseOrigin } from "@inlang/telemetry"
import { removeCommas } from "./helper/removeCommas.js"
import { missingTranslations } from "./helper/missingTranslations.js"
import { caching } from "cache-manager"

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

	// initialize a new file system on each request to prevent cross request pollution
	const fs = createMemoryFs()
	await cloneRespository(url, fs)

	// Set up the environment functions
	const env: InlangEnvironment = {
		$import: initialize$import({
			fs,
			fetch,
		}),
		$fs: fs,
	}

	// Get the content of the inlang.config.js file
	const file = await fs.readFile("/inlang.config.js", { encoding: "utf-8" }).catch((e) => {
		if (e.code !== "ENOENT") throw e
		throw new Error("No inlang.config.js file found in the repository.")
	})

	const config = await setupConfig({
		module: await import("data:application/javascript;base64," + btoa(file.toString())),
		env,
	})

	const resources = await config.readResources({ config })

	// Get ressources with lints
	const [resourcesWithLints, errors] = await lint({ resources, config })
	if (errors) {
		console.error("lints partially failed", errors)
	}

	const lints = getLintReports(resourcesWithLints)

	// find in resources the resource from the preferredLanguage
	const referenceResource = resources.find(
		(resource) => resource.languageTag.name === config.referenceLanguage,
	)
	if (!referenceResource) {
		throw new Error("No referenceLanguage found, please add one to your inlang.config.js")
	}

	const { percentage, numberOfMissingTranslations } = missingTranslations({
		resources,
		referenceResource,
	})

	const vdom = removeCommas(markup(percentage, numberOfMissingTranslations, lints))

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
	const gitOrigin = parseOrigin({ remotes: await getGitRemotes({ fs }) })

	telemetryNode.capture({
		event: "BADGE created",
		groups: { repository: gitOrigin },
		distinctId: "unknown",
	})
	// return image
	return image
}
