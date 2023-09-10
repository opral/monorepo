import type { ProjectConfig } from "@inlang/project-config"
import type { NodeishFilesystem } from "@lix-js/fs"
import { tryAutoGenModuleConfig } from "./tryAutoGenModuleConfig.js"

/**
 * Creates a now project.inlang.json file.
 *
 * @params args.nodeishFs a nodeishFs implementation, in node this is fs:promieses
 * @params args.pathJoin implementation for joing paths, in node this should be {join} from 'path'
 * @params args.filePath optional location of your inlang config file, should be used only for testing as we hard code filepaths at lots of places
 * @params args.tryAutoGen if the module configuration should be heuristically tried to generate, if false this will be only a minimal config file
 * @params args.languageTags the languages that should be supported next to the source language
 * @params args.sourceLanguagetag the main language that other langauges are translated to
 * @returns The warnings and if successfully generated the config object, the file is also saved to the filesystem in the current path
 */
export async function createProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	filePath?: string
	tryAutoGen?: boolean
	sourceLanguagetag: ProjectConfig["sourceLanguageTag"]
	languageTags: ProjectConfig["languageTags"]
}): Promise<{ warnings: string[]; config?: ProjectConfig }> {
	const minimalConfig: ProjectConfig = {
		$schema: "https://inlang.com/schema/project-config",
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
