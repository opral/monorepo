import { getConfigContent } from "@inlang/cli/src/utilities/getConfigContent"
import { getLanguageFolderPath } from "@inlang/cli/src/utilities/getLanguageFolderPath"
import {
	getSupportedLibrary,
	SupportedLibrary,
} from "@inlang/cli/src/utilities/getSupportedLibrary"
import { italic } from "@inlang/cli/src/utlilities/format"
import { vscodeFs } from "@inlang/cli/src/utlilities/fs"
import path from "node:path"
import * as vscode from "vscode"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"
import { getSetting, updateSetting } from "./settings/index.js"

/**
 * Creates an Inlang config file if it doesn't already exist and the user approves it.
 * @param args - An object containing the workspace folder.
 */
export const createInlangConfigFile = async (args: { workspaceFolder: vscode.WorkspaceFolder }) => {
	// Check if inlang.config.js already exists
	const configFiles = await vscode.workspace.findFiles("inlang.config.js")
	if (configFiles.length > 0) {
		console.warn("📄 inlang.config.js already exists")
		return
	}

	// Check if prompt is disabled
	if (await isDisabledConfigFileCreation()) return

	// Check for supported library
	const plugin = await getSupportedLibraryInProject(args.workspaceFolder)
	if (plugin === "json") return

	// Prompt user to create config file
	const createConfigFile = await promptUserToCreateConfigFile()

	if (createConfigFile === "Accept") {
		// Get language folder path
		const languageFolderPath = await getLanguageFolderPathRelativeToWorkspace(args.workspaceFolder)

		// Generate path pattern
		const pathPattern = generatePathPattern(languageFolderPath)

		if (pathPattern === "") {
			console.warn(
				"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
			)
		} else {
			console.info(`🗂️ Found language folder path: ${italic(pathPattern)}`)
			console.info(
				`🗂️ Please adjust the 'pathPattern' in the inlang.config.js manually if it is not parsed correctly.`,
			)
		}

		// Generate config file content
		const configContent = await getConfigContent({ plugin, pathPattern })
		await writeConfigFile(configContent, args.workspaceFolder)
	} else if (createConfigFile === "Reject") {
		// Disable config file creation
		disableConfigFileCreation()
	}

	trackOutcome(createConfigFile)
}

/**
 * Checks if the config file creation is disabled based on the git origin.
 * @returns A promise that resolves to a boolean indicating whether the config file creation is disabled.
 */
export const isDisabledConfigFileCreation = async (): Promise<boolean> => {
	return (await getSetting("disableConfigFileCreation")).includes(await getGitOrigin())
}

/**
 * Update the setting to disable the config file creation.
 * @param gitOrigin - The git origin.
 * @returns A promise that resolves once the setting has been updated.
 */
const disableConfigFileCreation = async (): Promise<void> => {
	const gitOrigin = await getGitOrigin()
	try {
		await updateSetting("disableConfigFileCreation", [
			...(await getSetting("disableConfigFileCreation")),
			gitOrigin,
		])
	} catch (error) {
		console.error(`Could not update setting 'disableConfigFileCreation'`)
		console.error(error)
	}
}

/**
 * Retrieves the supported library in the project.
 * @param workspaceFolder - The workspace folder.
 * @returns A promise that resolves to the supported library.
 */
const getSupportedLibraryInProject = async (
	workspaceFolder: vscode.WorkspaceFolder,
): Promise<SupportedLibrary> => {
	if (await vscode.workspace.findFiles("package.json")) {
		const packageJson = await readPackageJson(workspaceFolder)
		return getSupportedLibrary({ packageJson })
	} else {
		console.warn("📦 No package.json found in this directory. Using fallback plugin: json")
		return "json"
	}
}

/**
 * Reads the package.json file in the workspace folder.
 * @param workspaceFolder - The workspace folder.
 * @returns A promise that resolves to the parsed package.json content.
 */
const readPackageJson = async (workspaceFolder: vscode.WorkspaceFolder): Promise<any> => {
	const packageJsonContent = (
		await vscode.workspace.fs.readFile(vscode.Uri.joinPath(workspaceFolder.uri, "package.json"))
	).toString()
	return JSON.parse(packageJsonContent)
}

/**
 * Prompts the user to create a config file.
 * @returns A promise that resolves to a string representing the user's choice ("Accept" or "Reject").
 */
const promptUserToCreateConfigFile = async (): Promise<string | undefined> => {
	return await vscode.window.showInformationMessage(
		"Improve your i18n experience with Inlang. Do you want to create a config file?",
		"Accept",
		"Reject",
	)
}

/**
 * Gets the language folder path relative to the workspace folder.
 * @param workspaceFolder - The workspace folder.
 * @returns A promise that resolves to the language folder path.
 */
const getLanguageFolderPathRelativeToWorkspace = async (
	workspaceFolder: vscode.WorkspaceFolder,
): Promise<string | undefined> => {
	const languageFolderPath = await getLanguageFolderPath({
		fs: vscodeFs,
		rootDir: workspaceFolder.uri.fsPath,
	})
	if (languageFolderPath) {
		const relativePath = path.relative(workspaceFolder.uri.fsPath, languageFolderPath)
		return path.join(relativePath, "{language}.json")
	}
	return undefined
}

/**
 * Generates the path pattern based on the language folder path.
 * @param languageFolderPath - The language folder path.
 * @returns The generated path pattern.
 */
const generatePathPattern = (languageFolderPath: string | undefined): string => {
	if (languageFolderPath) {
		return languageFolderPath.replace(/\\/g, "/")
	}
	return ""
}

/**
 * Writes the config file to the workspace folder.
 * @param configContent - The config file content.
 * @param workspaceFolder - The workspace folder.
 */
const writeConfigFile = async (configContent: string, workspaceFolder: vscode.WorkspaceFolder) => {
	const configFilePath = vscode.Uri.joinPath(workspaceFolder.uri, "inlang.config.js")
	try {
		await vscode.workspace.fs.writeFile(configFilePath, Buffer.from(configContent))
		console.info(`🎉 Created inlang.config.js file at ${italic(configFilePath.fsPath)}`)
	} catch (error) {
		console.error(`📄 Could not create inlang.config.js file at ${italic(configFilePath.fsPath)}`)
		console.error(error)
	}
}

/**
 * Tracks the outcome of the create config file operation.
 * @param createConfigFile - The user's choice to create the config file.
 */
const trackOutcome = (createConfigFile: string | undefined) => {
	telemetry.capture({
		event: "IDE-EXTENSION completed create config file",
		properties: { outcome: createConfigFile ?? "Ignored" },
	})
}
