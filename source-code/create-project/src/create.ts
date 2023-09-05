import type { ProjectConfig } from "@inlang/project-config"
import type { NodeishFilesystem } from "@lix-js/fs"
import { tryAutoGenModuleConfig } from "./tryAutoGenModuleConfig.js"

export async function createProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	filePath?: string
	tryAutoGen?: boolean
	sourceLanguagetag: ProjectConfig["sourceLanguageTag"]
	languageTags: ProjectConfig["languageTags"]
}): Promise<{ warnings: string[]; config?: ProjectConfig }> {
	const minimalConfig: ProjectConfig = {
		sourceLanguageTag: args.sourceLanguagetag,
		languageTags: args.languageTags,
		modules: [],
		settings: {},
	}

	let newConfig
	let warnings: string[] = []
	if (args.tryAutoGen) {
		const autoGenResult = await tryAutoGenModuleConfig({
			baseConfig: minimalConfig,
			nodeishFs: args.nodeishFs,
			pathJoin: args.pathJoin,
		})
		newConfig = autoGenResult.config
		warnings = autoGenResult.warnings
	} else {
		newConfig = minimalConfig
	}

	if (newConfig) {
		const configString = JSON.stringify(newConfig, undefined, 4)
		await args.nodeishFs.writeFile(args.filePath || "./project.inlang.json", configString + "\n")
	}

	return { warnings, config: newConfig }
}
