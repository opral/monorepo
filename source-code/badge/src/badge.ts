// @prettier-ignore
import satori from "satori"
import clone from "./repo/clone.js"
import { Config, EnvironmentFunctions, initialize$import } from "@inlang/core/config"
import { getLintReports, lint } from "@inlang/core/lint"
import { Volume } from "memfs"
import { getRessourcePercentages, patchedFs, removeCommas } from "./helper/index.js"
import { markup } from "./helper/markup.js"
import { readFileSync } from "node:fs"
import { telemetryNode } from "@inlang/telemetry"

const fontMedium = readFileSync(new URL("./assets/static/Inter-Medium.ttf", import.meta.url))
const fontSemiBold = readFileSync(new URL("./assets/static/Inter-SemiBold.ttf", import.meta.url))

export const badge = async (url: string, preferredLanguage: string | undefined) => {
	// initialize a new file system on each request to prevent cross request pollution
	const fs = Volume.fromJSON({})
	await clone(url, fs)

	// Set up the environment functions
	const env: EnvironmentFunctions = {
		$import: initialize$import({
			fs: patchedFs(fs.promises),
			fetch,
		}),
		$fs: patchedFs(fs.promises),
	}

	if (fs.existsSync("/inlang.config.js") === false) {
		// TODO: render a badge here that says "no inlang.config.js file found in the repository"
		throw new Error("No inlang.config.js file found in the repository.")
	}

	// Get the content of the inlang.config.js file
	const file = await fs.promises.readFile("/inlang.config.js", "utf-8")
	const { defineConfig } = await import(
		"data:application/javascript;base64," + btoa(file.toString())
	)
	const config: Config = await defineConfig(env)
	const resources = await config.readResources({ config })

	// Get ressources with lints
	const [resourcesWithLints, errors] = await lint({ resources, config })
	if (errors) {
		console.error("lints partially failed", errors)
	}

	// get the lint reports
	const lints = getLintReports(resourcesWithLints)

	// calculate the percentages
	const percentages = getRessourcePercentages(resourcesWithLints)

	if (!percentages) {
		// TODO: render a badge that says "no translations found. Please add translations to your project"
		throw new Error("No translations found. Please add translations to your project.")
	}

	// markup the percentages
	const [_, owner, repo] = [...url.split("/")]
	const vdom = removeCommas(markup(percentages, preferredLanguage, owner + "/" + repo))

	// render the image
	const image = await satori(
		// @ts-ignore
		vdom,
		{
			width: 340,
			height: percentages.length * 50 + 300,
			fonts: [
				{
					name: "Inter Medium",
					weight: 500,
					data: fontMedium,
				},
				{
					name: "Inter SemiBold",
					weight: 600,
					data: fontSemiBold,
				},
			],
		},
	)

	telemetryNode.capture({
		event: "badge created",
		distinctId: owner + "/" + repo ?? "unknown",
	})

	// return image
	return image
}
