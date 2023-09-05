import type { NodeishFilesystem } from "@lix-js/fs"
import type { ProjectConfig } from "@inlang/project-config"
import { getLanguageFolderPath } from "./getLanguageFolderPath.js"

const pluginUrls: Record<string, string> = {
	sdkJs: "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	i18next: "https://cdn.jsdelivr.net/npm/@inlang/i18next@3/dist/index.js",
	typesafeI18n: "",
	json: "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
}

export type SupportedLibrary = keyof typeof pluginUrls

const standardLintRules = [
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
]

type PluginId = "inlang.plugin.${string}"

export async function tryAutoGenModuleConfig(args: {
	baseConfig: ProjectConfig
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	legacyConfig?: string
}): Promise<{ config?: ProjectConfig; warnings: string[]; pluginId?: PluginId }> {
	const rootDir = "./"
	const warnings: string[] = []

	let pluginName: SupportedLibrary = "json"

	const packageJson = JSON.parse(
		await args.nodeishFs.readFile("./package.json", { encoding: "utf-8" }).catch(() => "{}"),
	)

	if (args.legacyConfig) {
		warnings.push(
			"📦 Found legacy inlang configuration and trying a migration, please check the new one at 'project.inlang.json' matches the old one and remove it.",
		)
	}

	// Check if popular internationalization libraries are dependencies
	const { modules, lintRules } = getSupportedLibrary({
		packageJson,
		legacyConfig: args.legacyConfig,
	})

	if (!modules.length) {
		pluginName = "json"
		warnings.push("📦 Using fallback plugin: json, because no other configuration was found.")
	} else {
		pluginName = modules[0]!
	}

	if (pluginName === "@inlang/sdk-js") {
		warnings.push(
			"📦 Using plugin: @inlang/sdk-js.\nYou have to add a plugin which reads and writes resources e.g. the @inlang/plugin-json. See: https://inlang.com/documentation/plugins/registry",
		)
	} else if (pluginName === "typesafe-i18n") {
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

	args.baseConfig.modules = [pluginUrls[pluginName]!]

	if (!args.legacyConfig || lintRules.includes("standardLintRules")) {
		args.baseConfig.modules = [...args.baseConfig.modules, ...standardLintRules]
	}

	const pluginId: PluginId = ("inlang.plugin." + pluginName) as PluginId

	args.baseConfig.settings = {
		[pluginId!]: { pathPattern },
		...args.baseConfig.settings,
	} as ProjectConfig["settings"]

	return { warnings, config: { ...args.baseConfig }, pluginId }
}

export const getSupportedLibrary = (args: {
	packageJson: any
	legacyConfig?: string
}): { modules: SupportedLibrary[]; lintRules: string[] } => {
	const allDependencies = {
		...(args.packageJson.dependencies || {}),
		...(args.packageJson.devDependencies || {}),
	}

	// Determine the plugin based on the installed libraries or fallback to JSON plugin
	const moduleDetections: Set<string> = new Set()
	const lintRuleDetections: Set<string> = new Set()

	if (args.legacyConfig) {
		const matches = args.legacyConfig.matchAll(
			/(plugin-json)|(i18next)|(typesafe-i18n)|(sdk-js)|(standard-lint-rules)/g,
		)
		for (const [matched] of matches) {
			if (matched === "plugin-json") {
				moduleDetections.add("json")
			} else if (matched === "i18next") {
				moduleDetections.add("i18next")
			} else if (matched === "typesafe-i18n") {
				moduleDetections.add("typesafeI18n")
			} else if (matched === "sdk-js") {
				moduleDetections.add("sdkJs")
			} else if (matched === "standard-lint-rules") {
				lintRuleDetections.add("standardLintRules")
			}
		}
	}

	if (allDependencies["@inlang/sdk-js"]) {
		moduleDetections.add("sdkJs")
	}
	if (allDependencies["i18next"]) {
		moduleDetections.add("i18next")
	}
	if (allDependencies["typesafe-i18n"]) {
		moduleDetections.add("typesafeI18n")
	}

	return {
		modules: [...moduleDetections],
		lintRules: [...lintRuleDetections],
	}
}
