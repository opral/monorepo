import { Command } from "commander"
import { log } from "../../utilities/log.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import prompts from "prompts"
import { createProjectConfig } from "@inlang/create-project"
import { LanguageTag } from "@inlang/language-tag"
// import { Value } from "@sinclair/typebox/value"
// import { Type } from "@sinclair/typebox"

export const init = new Command()
	.command("init")
	.description(
		"Initialize a new inlang project in project.inlang.json with optional module configuration.",
	)
	.action(async () => {
		await initCommandAction({ logger: log, nodeishFs: fs })
	})

export async function initCommandAction(args: {
	nodeishFs: NodeishFilesystem
	filepath?: string
	logger: any
}) {
	const inlangConfigFilePath = "./project.inlang.json"

	try {
		const newProjFileStat = await fs.stat(inlangConfigFilePath)
		if (newProjFileStat) {
			args.logger.error("Aborting project intialization: Found exisitng inlang configuration.")
		}

		return
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			args.logger.error("unknown read error: " + error)
			return
		}
	}

	try {
		const oldProjFileStat = await fs.stat("./inlang.config.jsD")
		if (oldProjFileStat) {
			args.logger.error(
				"Found an existing inlang configuration int the legacy format, please run the migration command instead.",
			)
		}

		return
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			args.logger.error("unknown read error: " + error)
			return
		}
	}

	// FIXME: we should use typebox native checks but the follwing check seems to always be true even for wrong input
	// Value.Check(Type.String({ pattern: LanguageTag.pattern }), "as3df"),
	const languageTagRegex = new RegExp(`^(${LanguageTag.pattern})$`, "g")

	const { sourceLanguagetag } = await prompts({
		type: "text",
		name: "sourceLanguagetag",
		message: `What is the source language tag?
Inlang uses the web standard BCP 47 language tags to refer to human languages, regions, and locales.
You can read more here: inlang.com/documentation/language-tag`,
		initial: "en",
		validate: (value) =>
			!value.match(languageTagRegex)
				? "Not a valid BCP 47 language tag. You can read more here: inlang.com/documentation/language-tag "
				: true,
	})

	const { languageTags } = await prompts({
		type: "list",
		name: "languageTags",
		message: "What other languages do you want to add? example input: de, it",
		initial: "",
		validate: (value) => {
			const badLanuageTags = []
			for (const languageTag of value.replaceAll(" ", "").split(",")) {
				if (!languageTag.match(languageTagRegex)) {
					badLanuageTags.push(languageTag)
				}
			}
			if (badLanuageTags.length) {
				return `These entries are not a valid BCP 47 language tag: "${badLanuageTags}" You can read more here: inlang.com/documentation/language-tag`
			}
			return true
		},
	})

	const { autoConfig } = await prompts({
		type: "confirm",
		name: "autoConfig",
		message: "Should I try to install suitable modules?",
		initial: true,
	})

	if (autoConfig === true) {
		args.logger.warn("autoconfig is not suppored yet, just creating base configuration")
	}

	await createProjectConfig({
		tryAutoGen: autoConfig,
		sourceLanguagetag,
		languageTags: [...new Set(languageTags as string[])],
		nodeishFs: args.nodeishFs,
	})

	args.logger.info(`✅ Created your inlang configuration at: ${inlangConfigFilePath}`)
}
