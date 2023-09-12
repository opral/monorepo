/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NodeishFilesystem } from "@lix-js/fs"
import { getLanguageFolderPath } from "./getLanguageFolderPath.js"
import type { Plugin } from "@inlang/plugin"
import { Value } from "@sinclair/typebox/value"
import { ProjectConfig } from "@inlang/project-config"
import { openInlangProject } from "@inlang/sdk"
import { tryCatch } from "@inlang/result"

// FIXME: fetch latest major version instead
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

/**
 * Creates a new project.inlang.json file by trying to auto generate the project configuration
 *
 * @params args.nodeishFs a nodeishFs implementation, in node this is fs:promieses
 * @params args.pathJoin implementation for joing paths, in node this should be {join} from 'path'
 * @params args.filePath optional location of your inlang config file, should be used only for testing as we hard code filepaths at lots of places
 * @returns The warnings and if successfully generated the config object, the file is also saved to the filesystem in the current path
 */
export async function tryAutoGenProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	filePath?: string
}): Promise<{ warnings: string[]; errors?: any[]; config?: ProjectConfig }> {
	const { config, warnings } = await autoGenProject({
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
			errors = [...errors, ...runtimeErrors]
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

export async function autoGenProject(args: {
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
		? args.pathJoin(languageFolderPath, "{languageTag}.json")
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

	const pluginId: Plugin["meta"]["id"] = `plugin.inlang.${pluginName}`

	const config: ProjectConfig = {
		$schema: "https://inlang.com/schema/project-config",
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: [pluginUrls[pluginName]!, ...standardLintRules],
		settings: {
			[pluginId]: { pathPattern },
		} satisfies ProjectConfig["settings"],
	}

	const isValid = Value.Check(ProjectConfig, config)

	if (isValid) {
		return { warnings, config, pluginId }
	} else {
		const errors = [...Value.Errors(ProjectConfig, config)]
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
