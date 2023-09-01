import type { ProjectConfig } from "@inlang/project-config"
import type { NodeishFilesystem } from "@lix-js/fs"

export async function tryAutoGenModuleConfig(args: { baseConfig: ProjectConfig }): Promise<any> {
	// Maybe<ProjectConfigFile>
	// TODO: enrich baseConfic

	return { ...args.baseConfig }
}

export async function createProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	filePath?: string
	tryAutoGen?: boolean
	sourceLanguagetag: ProjectConfig["sourceLanguageTag"]
	languageTags: ProjectConfig["languageTags"]
}): Promise<void> {
	const newConfig: ProjectConfig = {
		sourceLanguageTag: args.sourceLanguagetag,
		languageTags: args.languageTags,
		modules: [],
		settings: {},
	}

	const configString = JSON.stringify(
		args.tryAutoGen ? tryAutoGenModuleConfig({ baseConfig: newConfig }) : newConfig,
		undefined,
		4,
	)

	await args.nodeishFs.writeFile(args.filePath || "./project.inlang.json", configString + "\n")
}
