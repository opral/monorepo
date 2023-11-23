import { normalizePath, type NodeishFilesystem, type createNodeishMemoryFs } from "@lix-js/fs"
import { getLanguageFolder } from "./getLanguageFolder.js"
import { tryCatch } from "@inlang/result"
import { ProjectSettings, loadProject } from "@inlang/sdk"
import { registry } from "@inlang/marketplace-registry"

/**
 * Tries to automatically generate a project.inlang.json file based on the project's dependencies.
 *
 * - The returned project settings are not written to the filesystem.
 * - Write the project settings manyally to the filesystem with `basePath` + '/project.inlang.json'
 *
 * @param args.basePath The base path to resolve from.
 *
 * @returns Generated project settings or undefined if the generation failed
 */
export async function tryAutoGenProjectSettings(args: {
	basePath: string
	nodeishFs: NodeishFilesystem
}): Promise<ProjectSettings | undefined> {
	const result: ProjectSettings = {
		$schema: "https://inlang.com/schema/project-settings",
		// assumes that the source language is English
		sourceLanguageTag: "en",
		languageTags: [],
		modules: [
			// including the most useful lint rule. additional lint rules can be
			// added manually later or prompted to be installed in inlang apps.
			// @ts-expect-error - typescript union is not smart enough to infer the correct type
			registry.find((item) => item.id === "messageLintRule.inlang.missingTranslation").module,
		],
	}

	const packageJson = JSON.parse(
		await args.nodeishFs
			.readFile(args.basePath + "/package.json", { encoding: "utf-8" })
			.catch(() => "{}")
	)

	const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })

	/**
	 * --------------- i18next ---------------
	 */

	if (dependencies.includes("i18next")) {
		const languageFolder = await getLanguageFolder({
			nodeishFs: args.nodeishFs,
			basePath: args.basePath,
		})
		if (!languageFolder) {
			// can't generate project settings without a language folder
			return
		}
		result.languageTags = languageFolder.languageTags
		result.modules.push(
			// @ts-expect-error - typescript union is not smart enough to infer the correct type
			registry.find((item) => item.id === "plugin.inlang.i18next").module
		)
		result["plugin.inlang.i18next"] = {
			pathPattern: normalizePath(`${languageFolder.path}/{languageTag}.json`),
		}
	}

	/**
	 * --------------- (TODO) react-intl & others ---------------
	 *
	 * else if (dependencies.includes("react-intl")) {
	 *
	 * }
	 */

	const projectPath = normalizePath(args.basePath + "/project.inlang")

	const mockFs = new Proxy(args.nodeishFs, {
		get: (target, prop) => {
			if (prop === "readFile") {
				return (...args: Parameters<ReturnType<typeof createNodeishMemoryFs>["readFile"]>) => {
					if (args[0] === projectPath + "/settings.json") {
						return JSON.stringify(result)
					}
					// @ts-expect-error
					return target[prop](args)
				}
			} else if (prop === "writeFile") {
				return () => {
					console.warn(
						"Writing to the filesystem is not allowed in tryAutoGenProjectSettings. No file has been written to the filesystem."
					)
				}
			}
			// @ts-expect-error
			return target[prop]
		},
	})

	const { data: project } = await tryCatch(() =>
		loadProject({
			settingsFilePath: projectPath,
			nodeishFs: mockFs,
		})
	)

	if (project?.errors().length === 0) {
		return result
	}
	return undefined
}
