import path from "node:path"
import * as vscode from "vscode"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"
import { msg } from "./message.js"
import { getSetting, updateSetting } from "./settings/index.js"
import {
	tryAutoGenProjectSettings,
	getLanguageFolderPath,
	getSupportedLibrary,
	type SupportedLibrary,
} from "@inlang/create-project"
import { createFileSystemMapper } from "./createFileSystemMapper.js"

/**
 * Creates an Inlang config file if it doesn't already exist and the user approves it.
 * @param args - An object containing the workspace folder.
 */
export const createInlangConfigFile = async (args: { workspaceFolder: vscode.WorkspaceFolder }) => {
	// Check if project.inlang.json already exists
	const configFiles = await vscode.workspace.findFiles("project.inlang.json")
	if (configFiles.length > 0) {
		console.warn("📄 project.inlang.json already exists")
		return
	}

	// check if supported library is in project
	const { modules } = await getSupportedLibraryInProject(args.workspaceFolder)
	if (modules.length === 0) {
		console.warn("📦 No supported internationalization library found in this project.")
		return
	}

	// Check if prompt is disabled
	if (await isDisabledConfigFileCreation()) return

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
			console.info(`🗂️ Found language folder path: ${pathPattern}`)
			console.info(
				`🗂️ Please adjust the 'pathPattern' in the project.inlang.json manually if it is not parsed correctly.`,
			)
		}

		// Generate config file content
		msg(
			"Creating project.inlang.json ...",
			"info",
			"statusBar",
			vscode.StatusBarAlignment.Left,
			5000,
		)
		const { warnings, errors } = await tryAutoGenProjectSettings({
			nodeishFs: createFileSystemMapper(args.workspaceFolder.uri.fsPath),
			pathJoin: path.join,
			filePath: args.workspaceFolder.uri.fsPath + "/project.inlang.json",
		})

		for (const warning of warnings) console.warn(warning)
		if (errors) {
			for (const error of errors) console.error(error)
		}

		// if no warnings, show success message
		if (warnings.length === 0 && errors?.length === 0) {
			console.info(
				`🎉 Created project.inlang.json file at ${
					args.workspaceFolder.uri.fsPath + "/project.inlang.json"
				}`,
			)
		}
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
): Promise<{ modules: SupportedLibrary[] }> => {
	if (await vscode.workspace.findFiles("package.json")) {
		const packageJson = await readPackageJson(workspaceFolder)
		return getSupportedLibrary({ packageJson })
	} else {
		console.warn("📦 No package.json found in this directory. Using fallback plugin: json")
		return { modules: ["json"] }
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
		nodeishFs: createFileSystemMapper(workspaceFolder.uri.fsPath),
		pathJoin: path.join,
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
 * Tracks the outcome of the create config file operation.
 * @param createConfigFile - The user's choice to create the config file.
 */
const trackOutcome = (createConfigFile: string | undefined) => {
	telemetry.capture({
		event: "IDE-EXTENSION completed create config file",
		properties: { outcome: createConfigFile ?? "Ignored" },
	})
}
