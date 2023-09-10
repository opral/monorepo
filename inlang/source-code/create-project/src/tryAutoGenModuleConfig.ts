/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NodeishFilesystem } from "@lix-js/fs"
import { ProjectConfig } from "@inlang/project-config"
import { getLanguageFolderPath } from "./getLanguageFolderPath.js"
import type { Plugin } from "@inlang/plugin"
import { Value } from "@sinclair/typebox/value"

// FIXME: get latest major version instead
export const pluginUrls: Record<string, string> = {
	i18next: "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
	json: "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js",
}

export type SupportedLibrary = keyof typeof pluginUrls

export const standardLintRules = [
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
]

export async function tryAutoGenModuleConfig(args: {
	baseConfig: ProjectConfig
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
}): Promise<{ config?: ProjectConfig; warnings: string[]; pluginId?: Plugin["meta"]["id"] }> {
	const rootDir = "./"
	const warnings: string[] = []

	let pluginName: SupportedLibrary = "json"

	const packageJson = JSON.parse(
		await args.nodeishFs.readFile("./package.json", { encoding: "utf-8" }).catch(() => "{}"),
	)

	// Check if popular internationalization libraries are dependencies
	const { modules } = getSupportedLibrary({
		packageJson,
	})

	if (!modules.length) {
		pluginName = "json"
		warnings.push("📦 Using fallback plugin: json, because no other configuration was found.")
	} else {
		pluginName = modules[0]!
	}

	if (pluginName === "sdkJs") {
		warnings.push(
			"📦 Using plugin: @inlang/sdk-js.\nYou have to add a plugin which reads and writes resources e.g. the @inlang/plugin-json. See: https://inlang.com/documentation/plugins/registry",
		)
	} else if (pluginName === "typesafeI18n") {
		warnings.push("Found typesafe-i18n, but it is not supported anymore.")
		return { warnings }
	}

	// Generate the config file content
	let pathPattern = `''`
	const languageFolderPath = await getLanguageFolderPath({
		nodeishFs: args.nodeishFs,
		pathJoin: args.pathJoin,
		rootDir,
	})
	const pathPatternRaw = languageFolderPath
		? args.pathJoin(languageFolderPath, "{language}.json")
		: ""

	// Windows: Replace backward slashes with forward slashes
	pathPattern = pathPatternRaw.replace(/\\/g, "/")
	if (pathPattern === "") {
		warnings.push(
			"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
		)
	} else {
		warnings.push(
			`🗂️  Found language folder path: '${pathPattern}', please adjust the ${`pathPattern`}\nin the project.inlang.json manually if it is not parsed correctly.`,
		)
	}

	args.baseConfig.modules = [pluginUrls[pluginName]!, ...standardLintRules]

	const pluginId: Plugin["meta"]["id"] = `plugin.inlang.${pluginName}`

	args.baseConfig.settings = {
		[pluginId]: { pathPattern },
		...args.baseConfig.settings,
	} satisfies ProjectConfig["settings"]

	const isValid = Value.Check(ProjectConfig, args.baseConfig)
	if (isValid) {
		return { warnings, config: { ...args.baseConfig }, pluginId }
	} else {
		const errors = [...Value.Errors(ProjectConfig, args.baseConfig)]
		warnings.push(
			`The generated config is not valid. Please adjust the config manually.\nErrors:\n${errors.join(
				"\n",
			)}`,
		)
		return { warnings }
	}
}

export const getSupportedLibrary = (args: {
	packageJson: any
}): { modules: SupportedLibrary[] } => {
	const allDependencies = {
		...(args.packageJson.dependencies || {}),
		...(args.packageJson.devDependencies || {}),
	}

	// Determine the plugin based on the installed libraries or fallback to JSON plugin
	const moduleDetections: Set<string> = new Set()

	if (allDependencies["i18next"]) {
		moduleDetections.add("i18next")
	}

	return {
		modules: [...moduleDetections],
	}
}
