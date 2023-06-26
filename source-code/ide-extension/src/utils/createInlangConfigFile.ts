import { getConfigContent } from "@inlang/cli/src/utilities/getConfigContent"
import { getLanguageFolderPath } from "@inlang/cli/src/utilities/getLanguageFolderPath"
import {
	getSupportedLibrary,
	SupportedLibrary,
} from "@inlang/cli/src/utilities/getSupportedLibrary"
import { italic } from "@inlang/cli/src/utlilities/format"
import { vscodeFs } from "@inlang/cli/src/utlilities/fs"
import { log } from "node:console"
import path from "node:path"
import * as vscode from "vscode"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"

export const disableConfigFileCreation = async (): Promise<boolean> => {
	const gitOrigin = await getGitOrigin()
	const _recommendation = (await vscode.workspace
		.getConfiguration("inlang")
		.get("disableConfigFileCreation")) as string[]

	return _recommendation.includes(gitOrigin)
}

export const createInlangConfigFile = async (args: { workspaceFolder: vscode.WorkspaceFolder }) => {
	// check if config file already exists
	const configFiles = await vscode.workspace.findFiles("inlang.config.js")
	if (configFiles.length > 0) {
		console.warn(`📄 inlang.config.js already exists`)
		return
	}

	// check if disabledConfigCreation setting is set to true
	if (await disableConfigFileCreation()) return

	// check if the repository has either i18next or typesafe-i18n installed in dependencies or devDependencies
	let plugin: SupportedLibrary = "json"
	if (await vscode.workspace.findFiles("package.json")) {
		// read package.json with vscode api
		const packageJson = JSON.parse(
			(
				await vscode.workspace.fs.readFile(
					vscode.Uri.joinPath(args.workspaceFolder.uri, "package.json"),
				)
			).toString(),
		)
		// Check if popular internationalization libraries are dependencies
		plugin = getSupportedLibrary({ packageJson })

		// Plugin specific logs
		if (plugin === "@inlang/sdk-js") {
			console.warn(
				"📦 Using plugin: @inlang/sdk-js. You have to add a plugin which reads and writes resources e.g. the inlang-plugin-json. See: https://inlang.com/documentation/plugins/registry",
			)
		}
	} else {
		console.warn("📦 No package.json found in this directory. Using fallback plugin: json")
		// Fallback, remove this someday
		plugin = "json"
	}
	// Prompt the user to create a config file with the message like Improve your i18n experience with Inlang. Do you want to create a config file?
	const createConfigFile = await vscode.window.showInformationMessage(
		"Improve your i18n experience with Inlang. Do you want to create a config file?",
		"Accept",
		"Reject",
	)

	if (createConfigFile === "Accept") {
		// Generate the config file content
		const languageFolderPath = await getLanguageFolderPath({
			fs: vscodeFs,
			rootDir: args.workspaceFolder.uri.fsPath,
		})
		const pathPatternRaw = languageFolderPath
			? path.join(languageFolderPath, "{language}.json")
			: ""

		// Windows: Replace backward slashes with forward slashes
		const pathPattern = pathPatternRaw.replace(/\\/g, "/")

		if (pathPattern === "") {
			console.warn(
				"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
			)
		} else {
			console.info(`🗂️  Found language folder path: ${italic(pathPattern)}`)
			console.info(
				`🗂️  Please adjust the ${`pathPattern`} in the inlang.config.js manually if it is not parsed correctly.`,
			)
		}

		const configContent = await getConfigContent({ plugin, pathPattern })
		const configFilePath = vscode.Uri.joinPath(args.workspaceFolder.uri, "inlang.config.js")
		try {
			await vscode.workspace.fs.writeFile(configFilePath, Buffer.from(configContent))
			console.info(`🎉 Created inlang.config.js file at ${italic(configFilePath.fsPath)}`)
		} catch (error) {
			console.error(`📄 Could not create inlang.config.js file at ${italic(configFilePath.fsPath)}`)
			console.error(error)
		}
	} else if (createConfigFile === "Reject") {
		// add git origin to disableConfigCreation setting
		const gitOrigin = await getGitOrigin()
		const _recommendation = (await vscode.workspace
			.getConfiguration("inlang")
			.get("disableConfigFileCreation")) as string[]
		await vscode.workspace
			.getConfiguration("inlang")
			.update("disableConfigFileCreation", [..._recommendation, gitOrigin], true)
	}

	// Track the outcome
	telemetry.capture({
		event: "IDE-EXTENSION completed create config file",
		// if the user does not react, the outcome is undefined aka "Ignored"
		properties: { outcome: createConfigFile ?? "Ignored" },
	})
}
