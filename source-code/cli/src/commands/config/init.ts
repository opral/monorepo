import { Command } from "commander"
import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"
import { log } from "../../utilities.js"
import { bold, italic } from "../../utilities/format.js"
import { validateCommandAction } from "./validate.js"
import * as vscode from "vscode"

// Plugin import types
type PluginImports = {
	[key: string]: string
}

export const init = new Command()
	.command("init")
	.description("Initialize the inlang.config.js file.")
	.action(() => initCommandAction({ fs }))

// Function to determine the first potential language folder path based on the file system
function getLanguageFolderPath(rootDir: string): string | undefined {
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

	const searchForLanguageFolder = (dir: string, ignoredPaths: string[]): string | undefined => {
		const files = fs.readdirSync(dir)

		// Check if .gitignore exists
		const gitignorePath = path.join(dir, ".gitignore")
		let subIgnoredPaths: string[] = []
		if (fs.existsSync(gitignorePath)) {
			const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8")
			subIgnoredPaths = gitignoreContent
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => !line.startsWith("#") && line !== "")
		}

		for (const file of files) {
			const filePath = path.join(dir, file)
			const stat = fs.statSync(filePath)

			if (
				stat.isDirectory() &&
				file !== "node_modules" &&
				!ignoredPaths.some((ignoredPath) => filePath.includes(ignoredPath))
			) {
				const folderName = file.toLowerCase()
				if (potentialFolders.includes(folderName)) {
					return filePath
				}

				if (!filePath.includes("node_modules")) {
					const subLanguageFolder = searchForLanguageFolder(filePath, [
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

	return searchForLanguageFolder(rootDir, [])
}

/**
 * Initialize the inlang.config.js file.
 *
 * @returns {Promise<void>} Promise that resolves when the command is done.
 * @example
 *
 * ```ts
 * import { initCommandAction } from "@inlang/cli/dist/commands/config/init.js"
 *
 * await initCommandAction()
 * ```
 */
export async function initCommandAction(args: { fs: typeof fs }): Promise<void> {
	// Detect visual studio code environment
	const isVsCode = !!process.env.VSCODE_PID

	// Check if config file already exists
	const packageJsonPath = "./package.json"
	const inlangConfigPath = "./inlang.config.js"
	const rootDir = "./"

	if (args.fs.existsSync(inlangConfigPath)) {
		log.error("⏸️  Config file already exists.")
		if (isVsCode) return

		const answer = await prompts({
			type: "confirm",
			name: "overwrite",
			message: "Do you want to overwrite the existing config file?",
			initial: false,
		})
		if (answer.overwrite === false) {
			log.info("Aborting.")
			return
		}
	}

	// Check if the user wants to continue with the WIP version
	if (!isVsCode) {
		const answerWip = await prompts({
			type: "confirm",
			name: "wip",
			message:
				"The auto generation is work in progress and might not work as expected. Do you want to continue?",
			initial: true,
		})
		if (answerWip.wip === false) {
			return
		}
	}

	// Check if popular internationalization libraries are dependencies
	const packageJson = JSON.parse(args.fs.readFileSync(packageJsonPath, "utf-8"))
	const dependencies = packageJson.dependencies || {}
	const devDependencies = packageJson.devDependencies || {}
	const isInlangSdkJsInstalled =
		!!dependencies["@inlang/sdk-js"] || !!devDependencies["@inlang/sdk-js"]
	const isI18nextInstalled = !!dependencies["i18next"] || !!devDependencies["i18next"]
	const isTypesafeI18nInstalled =
		!!dependencies["typesafe-i18n"] || !!devDependencies["typesafe-i18n"]

	// log that supported package was found
	if (isInlangSdkJsInstalled) {
		log.info(`✅ Supported library found: ${bold("@inlang/sdk-js")}`)
	}
	if (isI18nextInstalled) {
		log.info(`✅ Supported library found: ${bold("i18next")}`)
	}
	if (isTypesafeI18nInstalled) {
		log.info(`✅ Supported library found: ${bold("typesafe-i18n")}`)
	}

	// Determine the plugin based on the installed libraries or fallback to JSON plugin
	let plugin = ""
	if (isInlangSdkJsInstalled) {
		plugin = "@inlang/sdk-js"
	} else if (isI18nextInstalled) {
		plugin = "i18next"
	} else if (isTypesafeI18nInstalled) {
		plugin = "typesafe-i18n"
	} else {
		// Fallback, remove this someday
		plugin = "json"
	}

	// Plugin specific logs
	if (plugin === "@inlang/sdk-js") {
		log.warn(
			"📦 Using plugin: @inlang/sdk-js. You have to add a plugin which reads and writes resources e.g. the inlang-plugin-json. See: https://inlang.com/documentation/plugins/registry",
		)
	}

	// Generate the config file content
	const languageFolderPath = getLanguageFolderPath(rootDir)
	const pathPattern = languageFolderPath ? path.join(languageFolderPath, "{language}.json") : ""
	if (pathPattern === "") {
		log.warn(
			"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
		)
	} else {
		log.info(`🗂️  Found language folder path: ${italic(pathPattern)}`)
		log.info(
			`🗂️  Please adjust the ${`pathPattern`} in the inlang.config.js manually if it is not parsed correctly.`,
		)
	}

	const pluginImports: PluginImports = {
		json: `const { default: jsonPlugin } = await env.$import('https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@latest/dist/index.js');`,
		i18next: `const { default: i18nextPlugin } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@2/dist/index.js');`,
		"typesafe-i18n": `const { default: typesafeI18nPlugin } = await env.$import('https://cdn.jsdelivr.net/gh/ivanhofer/inlang-plugin-typesafe-i18n@2/dist/index.js');`,
		"@inlang/sdk-js": `const { default: sdkPlugin } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js');`,
	}

	const pluginImportsCode = pluginImports[plugin] || ""

	const pluginFunctions = [
		plugin === "json" ? `jsonPlugin({ pathPattern: '${pathPattern}' }),` : undefined,
		plugin === "@inlang/sdk-js"
			? `sdkPlugin({languageNegotiation: { strategies: [{ type: "localStorage" }]}}),`
			: undefined,
		plugin === "i18next" ? `i18nextPlugin({ pathPattern: '${pathPattern}' }),` : undefined,
		plugin === "typesafe-i18n" ? `typesafeI18nPlugin(),` : undefined,
	]
		.filter((x) => x !== undefined)
		.join("\n")

	const configContent = `
	/**
 	* @type { import("@inlang/core/config").DefineConfig }
 	*/
	export async function defineConfig(env) {
    ${pluginImportsCode}
    
    const { default: standardLintRules } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js');

    return {
      referenceLanguage: 'en',
      plugins: [
        ${pluginFunctions}
        standardLintRules(),
      ],
    };
  }`

	// Write the config file
	args.fs.writeFileSync(inlangConfigPath, configContent)

	log.success(`🎉 inlang.config.js file created successfully.`)

	// validate the config file
	validateCommandAction()
}
