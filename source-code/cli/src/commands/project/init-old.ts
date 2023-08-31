// export async function initCommandAction() {
// // Check if config file already exists
// const packageJsonPath = "./package.json"
// const inlangProjectFilePath = "./project.inlang.json"
// const rootDir = "./"
// // check if package.json exists
// let plugin: SupportedLibrary = "json"
// if (fs.existsSync(packageJsonPath)) {
// 	// Check if popular internationalization libraries are dependencies
// 	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
// 	plugin = getSupportedLibrary({ packageJson })
// 	// Plugin specific logs
// 	if (plugin === "@inlang/sdk-js") {
// 		log.warn(
// 			"📦 Using plugin: @inlang/sdk-js. You have to add a plugin which reads and writes resources e.g. the @inlang/plugin-json. See: https://inlang.com/documentation/plugins/registry",
// 		)
// 	}
// } else {
// 	log.warn("📦 No package.json found in this directory. Using fallback plugin: json")
// 	// Fallback, remove this someday
// 	plugin = "json"
// }
// // Generate the config file content
// let pathPattern = `''`
// if (plugin !== "typesafe-i18n") {
// 	const languageFolderPath = await getLanguageFolderPath({ fs: nodeFileSystem, rootDir })
// 	const pathPatternRaw = languageFolderPath
// 		? path.join(languageFolderPath, "{language}.json")
// 		: ""
// 	// Windows: Replace backward slashes with forward slashes
// 	pathPattern = pathPatternRaw.replace(/\\/g, "/")
// 	if (pathPattern === "") {
// 		log.warn(
// 			"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
// 		)
// 	} else {
// 		log.info(`🗂️  Found language folder path: ${italic(pathPattern)}`)
// 		log.info(
// 			`🗂️  Please adjust the ${`pathPattern`} in the project.inlang.json manually if it is not parsed correctly.`,
// 		)
// 	}
// }
// const configContent = await getConfigContent({
// 	plugin,
// 	pathPattern,
// })
// // Write the config file
// fs.writeFileSync(inlangProjectFilePath, configContent)
// // validate the config file
// const [, error] = await getInlang({ options: cli.opts() })
// if (error) {
// 	log.error(error)
// 	return
// }
// log.success(`🎉 project.inlang.json file created successfully.`)
