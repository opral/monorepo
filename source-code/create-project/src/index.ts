import type { ProjectConfig } from "@inlang/project-config"
import type { NodeishFilesystem } from "@lix-js/fs"

// TODO: @janfjohannes @felixhaeberle 
// TODO: 1. I would move implemntation code from index. It is unclear what 
// TODO:    APIs this file exports on a glance. 
// TODO: 2. You need to remove console.log statements. 
// TODO:		- The library's runtime environment is unknown. 
// TODO:    - An an example, VSCode users won't see the logs ;) 
// TODO:    - Let the consumer pass a logger. 

const potentialFolders = [
	"language",
	"languages",
	"lang",
	"locale",
	"locales",
	"i18n",
	"translations",
	"translation",
	"resources",
	// Add other potential folder names here
]

const pluginUrls: Record<string, string> = {
	sdkJs: "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	i18next: "https://cdn.jsdelivr.net/npm/@inlang/i18next@3/dist/index.js",
	typesafeI18n: "",
	json: "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
}

const standardLintRules = [
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
	"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
]

export type SupportedLibrary = keyof typeof pluginUrls

export async function createProjectConfig(args: {
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
	filePath?: string
	tryAutoGen?: boolean
	sourceLanguagetag: ProjectConfig["sourceLanguageTag"]
	languageTags: ProjectConfig["languageTags"]
}): Promise<{ warnings: string[]; config: ProjectConfig }> {
	const minimalConfig: ProjectConfig = {
		sourceLanguageTag: args.sourceLanguagetag,
		languageTags: args.languageTags,
		modules: [...standardLintRules],
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

	const configString = JSON.stringify(newConfig, undefined, 4)

	await args.nodeishFs.writeFile(args.filePath || "./project.inlang.json", configString + "\n")

	return { warnings, config: newConfig }
}

async function tryAutoGenModuleConfig(args: {
	baseConfig: ProjectConfig
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
}): Promise<{ config: ProjectConfig; warnings: string[] }> {
	const packageJsonPath = "./package.json"
	const rootDir = "./"
	const warnings: string[] = []

	let pluginName: SupportedLibrary = "json"

	if (await args.nodeishFs.stat(packageJsonPath).catch(() => false)) {
		// Check if popular internationalization libraries are dependencies
		const packageJson = JSON.parse(
			await args.nodeishFs.readFile(packageJsonPath, { encoding: "utf-8" }),
		)
		pluginName = getSupportedLibrary({ packageJson })
		// Plugin specific logs
		if (pluginName === "@inlang/sdk-js") {
			warnings.push(
				"📦 Using plugin: @inlang/sdk-js.\nYou have to add a plugin which reads and writes resources e.g. the @inlang/plugin-json. See: https://inlang.com/documentation/plugins/registry",
			)
		}
	} else {
		warnings.push("📦 No package.json found in this directory. Using fallback plugin: json")
		// Fallback, remove this someday
		pluginName = "json"
	}

	// Generate the config file content
	let pathPattern = `''`
	if (pluginName === "typesafe-i18n") {
		warnings.push(
			"Found typesafe-i18n, but it is not supported anymore, please migrate to @inlang/paraglide.",
		)
	} else {
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

		args.baseConfig.modules = [pluginUrls[pluginName]!, ...args.baseConfig.modules]
		const pluginId = "plugin.inlang." + pluginName

		args.baseConfig.settings = {
			[pluginId!]: { pathPattern },
			...args.baseConfig.settings,
		} as ProjectConfig["settings"]
	}

	return { warnings, config: { ...args.baseConfig } }
}

export const getSupportedLibrary = (args: { packageJson: any }): SupportedLibrary => {
	const dependencies = args.packageJson.dependencies || {}
	const devDependencies = args.packageJson.devDependencies || {}

	const isInlangSdkJsInstalled =
		!!dependencies["@inlang/sdk-js"] || !!devDependencies["@inlang/sdk-js"]
	const isI18nextInstalled = !!dependencies["i18next"] || !!devDependencies["i18next"]
	const isTypesafeI18nInstalled =
		!!dependencies["typesafe-i18n"] || !!devDependencies["typesafe-i18n"]

	// log that supported package was found
	if (isInlangSdkJsInstalled) {
		console.info(`✅ Supported library found: ${"@inlang/sdk-js"}`)
	}
	if (isI18nextInstalled) {
		console.info(`✅ Supported library found: ${"i18next"}`)
	}
	if (isTypesafeI18nInstalled) {
		console.info(`✅ Supported library found: ${"typesafe-i18n"}`)
	}

	// Determine the plugin based on the installed libraries or fallback to JSON plugin
	if (isInlangSdkJsInstalled) {
		return "@inlang/sdk-js"
	} else if (isI18nextInstalled) {
		return "i18next"
	} else if (isTypesafeI18nInstalled) {
		return "typesafeI18n"
	} else {
		// Fallback, remove this someday
		return "json"
	}
}

export const getLanguageFolderPath = async (args: {
	rootDir: string
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
}): Promise<string | undefined> => {
	console.info("Searching for language folder in", args.rootDir)
	try {
		const searchForLanguageFolder = async (
			dir: string,
			ignoredPaths: string[],
		): Promise<string | undefined> => {
			const files = await args.nodeishFs.readdir(dir)

			const gitignorePath = args.pathJoin(dir, ".gitignore")
			let subIgnoredPaths: string[] = []
			if (await args.nodeishFs.stat(gitignorePath).catch(() => false)) {
				const gitignoreContent = await args.nodeishFs.readFile(gitignorePath, { encoding: "utf-8" })
				subIgnoredPaths = gitignoreContent
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => !line.startsWith("#") && line !== "")
			}

			for (const file of files) {
				const filePath = args.pathJoin(dir, file)
				const stat = await args.nodeishFs.stat(filePath).catch((error) => ({
					error,
				}))

				if (
					!("error" in stat) &&
					stat.isDirectory() &&
					file !== "node_modules" &&
					!ignoredPaths.some((ignoredPath) => filePath.includes(ignoredPath))
				) {
					const folderName = file.toLowerCase()
					if (potentialFolders.includes(folderName)) {
						return filePath
					}

					if (!filePath.includes("node_modules")) {
						const subLanguageFolder = await searchForLanguageFolder(filePath, [
							...ignoredPaths,
							...subIgnoredPaths,
						])
						if (subLanguageFolder) {
							return subLanguageFolder
						}
					}
				}
			}

			return undefined
		}

		return await searchForLanguageFolder(args.rootDir, [])
	} catch (error) {
		console.error("Error in getLanguageFolderPath:", error)
		return undefined
	}
}
