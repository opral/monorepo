import type { NodeishFilesystem } from "@lix-js/fs"
import { ProjectConfig } from "@inlang/project-config"
import { pluginUrls, standardLintRules, type PluginId } from "./tryAutoGenModuleConfig.js"
// @ts-ignore
import { format } from "prettier/standalone.mjs"
// @ts-ignore
import prettierPluginTS from "prettier/plugins/typescript.mjs"
// @ts-ignore
import prettierPluginEsTree from "prettier/plugins/estree.mjs"

function parseDirtyValue(jsString: string) {
	let normalized = jsString.trim().replaceAll(`'`, `"`)
	if (normalized.endsWith(",")) {
		normalized = normalized.slice(0, -1)
	}
	return JSON.parse(normalized)
}

export async function migrateProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	filePath?: string
}): Promise<{ warnings: string[]; config?: ProjectConfig }> {
	const config: ProjectConfig = {
		sourceLanguageTag: "",
		languageTags: [],
		modules: [],
		settings: {},
	}

	let warnings: string[] = []

	const legacyConfig = await format(
		await args.nodeishFs.readFile("./inlang.config.js", { encoding: "utf-8" }).catch(() => ""),
		{
			parser: "typescript",
			plugins: [prettierPluginTS, prettierPluginEsTree],
		},
	)

	if (!legacyConfig) {
		warnings.push("Could not read valid legacy configuration file ./inlang.config.js.")
		return { warnings }
	}

	const searchMapping: Record<string, string> = {
		languages: "languageTags",
		variableReferencePattern: "variableReferencePattern",
		pathPattern: "pathPattern",
		referenceLanguage: "sourceLanguageTag",
	}

	const parseErrors: string[] = []
	const extractions: Record<string, any> = {}

	for (const [index, curLine] of legacyConfig.split("\n").entries()) {
		const line: string = curLine || ""
		for (const searchKey of Object.keys(searchMapping)) {
			if (line.includes(searchKey)) {
				try {
					const [_, dirtyValue] = line.split(":")
					if (dirtyValue) {
						const extracted = parseDirtyValue(dirtyValue)
						const newKey = searchMapping[searchKey]
						extractions[newKey!] = extracted
					} else {
						parseErrors.push(`Could not auto migrate line ${index}: "${line}"`)
					}
				} catch (error) {
					parseErrors.push(`Could not auto migrate line ${index}: "${line}"`)
				}
			}
		}
	}

	const moduleDetections: Set<string> = new Set()
	const lintRuleDetections: Set<string> = new Set()
	const matches = legacyConfig.matchAll(
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

	const pluginName: string = moduleDetections.values().next().value as string
	const pluginId: PluginId = ("inlang.plugin." + pluginName) as PluginId

	config.modules = [pluginUrls[pluginName]!, ...standardLintRules]

	config.settings = {
		[pluginId!]: {
			pathPattern: extractions.pathPattern || "",
			variableReferencePattern: extractions.variableReferencePattern || undefined,
		},
		...config.settings,
	} as ProjectConfig["settings"]

	config.sourceLanguageTag = extractions.sourceLanguageTag || ""
	config.languageTags = extractions.languageTags || []

	const configString = JSON.stringify(config, undefined, 4)
	await args.nodeishFs.writeFile(args.filePath || "./project.inlang.json", configString + "\n")

	return { warnings: [...warnings, ...parseErrors], config }
}
