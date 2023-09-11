import type { ProjectConfig } from "@inlang/project-config"
import type { NodeishFilesystem } from "@lix-js/fs"
import { tryAutoGenProjectConfig } from "./tryAutoGenProjectConfig.js"
import { openInlangProject } from "@inlang/sdk"
import { tryCatch } from "@inlang/result"

/**
 * Creates a now project.inlang.json file.
 *
 * @params args.nodeishFs a nodeishFs implementation, in node this is fs:promieses
 * @params args.pathJoin implementation for joing paths, in node this should be {join} from 'path'
 * @params args.filePath optional location of your inlang config file, should be used only for testing as we hard code filepaths at lots of places
 * @returns The warnings and if successfully generated the config object, the file is also saved to the filesystem in the current path
 */
export async function createProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	filePath?: string
}): Promise<{ warnings: string[]; errors?: any[]; config?: ProjectConfig }> {
	const { config, warnings } = await tryAutoGenProjectConfig({
		nodeishFs: args.nodeishFs,
		pathJoin: args.pathJoin,
	})

	const projectFilePath = args.filePath || "./project.inlang.json"

	if (config) {
		const configString = JSON.stringify(config, undefined, 4)
		await args.nodeishFs.writeFile(projectFilePath, configString + "\n")
	} else {
		return { warnings: ["Could not auto generate project configuration."] }
	}

	const { data, error } = await tryCatch(() =>
		openInlangProject({
			projectFilePath: projectFilePath,
			nodeishFs: args.nodeishFs,
		}),
	)

	let errors: any[] = []
	if (error) {
		errors = [error]
	} else {
		const runtimeErrors = data?.errors()
		if (runtimeErrors?.length) {
			errors = errors.concat(runtimeErrors)
		}
	}

	if (errors.length > 0) {
		try {
			await args.nodeishFs.rm(projectFilePath)
		} catch {
			/* ignore failing file removal */
		}

		return { warnings, errors }
	}

	return { warnings, errors, config }
}
