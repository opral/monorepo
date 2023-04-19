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
import { query } from "@inlang/core/query"
import type * as ast from "@inlang/core/ast"

const fontMedium = readFileSync(new URL("./assets/static/Inter-Medium.ttf", import.meta.url))
const fontBold = readFileSync(new URL("./assets/static/Inter-Bold.ttf", import.meta.url))

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

	const lints = getLintReports(resourcesWithLints)

	// calculate the percentages
	const percentages = getRessourcePercentages(resourcesWithLints)

	if (!percentages) {
		// TODO: render a badge that says "no translations found. Please add translations to your project"
		throw new Error("No translations found. Please add translations to your project.")
	}

	// If preferred language is not set, set it to english
	if (!preferredLanguage) {
		preferredLanguage = "en"
	}

	// Remove the region from the language
	if (preferredLanguage?.includes("-")) {
		preferredLanguage = preferredLanguage.split("-")[0]
	}

	// find in resources the resource from the preferredLanguage
	const referenceResource = resources.find(
		(resource) => resource.languageTag.name === config.referenceLanguage,
	)
	if (!referenceResource) {
		throw new Error("No referenceLanguage found, please add one to your inlang.config.js")
	}

	// get all the ids from the preferredLanguageResource
	const referenceIds = query(referenceResource).includedMessageIds()
	const numberOfMissingMessages: { language: string; id: string }[] = []

	// loop through all the resources and check if the ids are included in the preferredLanguageResource
	for (const resource of resources) {
		const language = resource.languageTag.name
		for (const id of referenceIds) {
			if (query(resource).get({ id }) === undefined) {
				numberOfMissingMessages.push({
					language,
					id,
				})
			}
		}
	}

	// filter number of missing messages by preferredLanguage
	const numberOfMissingMessagesInPreferredLanguage = numberOfMissingMessages.filter(
		(message) => message.language === preferredLanguage,
	).length

	// markup the percentages
	const [host, owner, repository] = [...url.split("/")]
	const vdom = removeCommas(
		markup(percentages, preferredLanguage, numberOfMissingMessagesInPreferredLanguage, lints),
	)

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

	telemetryNode.capture({
		event: "BADGE created",
		distinctId: "unknown",
		properties: {
			host,
			owner,
			repository,
		},
	})

	// return image
	return image
}
