import type { NodeishFilesystem } from "@lix-js/fs"
import { ProjectConfig } from "@inlang/project-config"
import { tryAutoGenModuleConfig } from "./tryAutoGenModuleConfig.js"

function parseDirtyValue(jsString: string) {
	let normalized = jsString.trim().replaceAll("'", `"`)
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
	const minimalConfig: ProjectConfig = {
		sourceLanguageTag: "",
		languageTags: [],
		modules: [],
		settings: {},
	}

	let warnings: string[] = []

	const legacyConfig = await args.nodeishFs
		.readFile("./inlang.config.js", { encoding: "utf-8" })
		.catch(() => "")

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

	legacyConfig.split("\n").forEach((curLine, index) => {
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
	})

	// First use auto module config generation
	const autoGenResult = await tryAutoGenModuleConfig({
		baseConfig: minimalConfig,
		nodeishFs: args.nodeishFs,
		pathJoin: args.pathJoin,
		legacyConfig,
	})

	const newConfig = autoGenResult.config
	warnings = [...autoGenResult.warnings, ...parseErrors]

	if (!newConfig || !autoGenResult.pluginId) {
		return { warnings }
	}

	// Then Override the aut generation whith what we could extract from the old config format
	newConfig.sourceLanguageTag = extractions.sourceLanguageTag || ""
	newConfig.languageTags = extractions.languageTags || []

	if (autoGenResult.pluginId in newConfig.settings) {
		if (extractions.pathPattern) {
			// FIXME: type
			// @ts-ignore
			newConfig.settings[autoGenResult.pluginId].pathPattern = extractions.pathPattern
		}
		if (extractions.variableReferencePattern) {
			// FIXME: type
			// @ts-ignore
			newConfig.settings[autoGenResult.pluginId].variableReferencePattern =
				extractions.variableReferencePattern
		}
	}

	const configString = JSON.stringify(newConfig, undefined, 4)
	await args.nodeishFs.writeFile(args.filePath || "./project.inlang.json", configString + "\n")

	return { warnings, config: newConfig }
}
