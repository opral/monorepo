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

export async function oldinitCommandAction() {
	const packageJsonPath = "./package.json"
	const rootDir = "./"

	let plugin: SupportedLibrary = "json"

	if (fsClassic.existsSync(packageJsonPath)) {
		// Check if popular internationalization libraries are dependencies
		const packageJson = JSON.parse(fsClassic.readFileSync(packageJsonPath, "utf-8"))
		plugin = getSupportedLibrary({ packageJson })
		// Plugin specific logs
		if (plugin === "@inlang/sdk-js") {
			log.warn(
				"📦 Using plugin: @inlang/sdk-js. You have to add a plugin which reads and writes resources e.g. the @inlang/plugin-json. See: https://inlang.com/documentation/plugins/registry",
			)
		}
	} else {
		log.warn("📦 No package.json found in this directory. Using fallback plugin: json")
		// Fallback, remove this someday
		plugin = "json"
	}

	// Generate the config file content
	let pathPattern = `''`
	if (plugin !== "typesafe-i18n") {
		const languageFolderPath = await getLanguageFolderPath({ fs: NodeishFilesystem, rootDir })
		const pathPatternRaw = languageFolderPath
			? path.join(languageFolderPath, "{language}.json")
			: ""

		// Windows: Replace backward slashes with forward slashes
		pathPattern = pathPatternRaw.replace(/\\/g, "/")
		if (pathPattern === "") {
			log.warn(
				"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
			)
		} else {
			log.info(`🗂️  Found language folder path: ${italic(pathPattern)}`)
			log.info(
				`🗂️  Please adjust the ${`pathPattern`} in the project.inlang.json manually if it is not parsed correctly.`,
			)
		}
	}
}
