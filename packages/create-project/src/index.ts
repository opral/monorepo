import type { InlangConfig } from "@inlang/sdk"
import type { NodeishFilesystem } from "@lix-js/fs"

export async function tryAutoGenModuleConfig(args: { baseConfig: InlangConfig }): any {
	// Maybe<ProjectConfigFile>
	// TODO: enrich baseConfic

	return { ...args.baseConfig }
}

export async function createProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	filePath?: string
	tryAutoGen?: boolean
	sourceLanguagetag: InlangConfig["sourceLanguageTag"]
	languageTags: InlangConfig["languageTags"]
}): Promise<void> {
	const newConfig: InlangConfig = {
		sourceLanguageTag: args.sourceLanguagetag,
		languageTags: args.languageTags,
		modules: [],
		settings: {},
	}

	const configString = JSON.stringify(
		args.tryAutoGen ? tryAutoGenModuleConfig(newConfig) : newConfig,
		undefined,
		4,
	)

	await args.nodeishFs.writeFile(args.filePath || "./project.inlang.json", configString + "\n")
}
