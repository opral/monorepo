import path from "node:path"
import * as vscode from "vscode"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"
import { getSetting, updateSetting } from "./settings/index.js"
import { tryAutoGenProjectSettings } from "@inlang/create-project"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import { CONFIGURATION } from "../configuration.js"

/**
 * Creates an Inlang config file if it doesn't already exist and the user approves it.
 * @param args - An object containing the workspace folder.
 */
export const createInlangConfigFile = async (args: { workspaceFolder: vscode.WorkspaceFolder }) => {
	// Check if project.inlang.json already exists
	const configFiles = await vscode.workspace.findFiles(CONFIGURATION.FILES.PROJECT)
	if (configFiles.length > 0) {
		// skip
		return
	}

	// Try to auto generate project settings
	const nodeishFs = createFileSystemMapper(args.workspaceFolder.uri.fsPath)
	const projectFilePath = `${args.workspaceFolder.uri.fsPath}/${CONFIGURATION.FILES.PROJECT}`

	// with nodeishFs, read package.json &
	const packageJson = await nodeishFs.readFile("./package.json", { encoding: "utf-8" })
	const packageJsonParsed = JSON.parse(packageJson)

	// check if i18next dependency exists
	const i18nextDependency = packageJsonParsed.dependencies.i18next

	if (!i18nextDependency) {
		// skip
		return
	}

	// Check if prompt is disabled
	if (await isDisabledConfigFileCreation()) return

	// Prompt user to create config file
	const createConfigFile = await promptUserToCreateConfigFile()

	if (createConfigFile === "Accept") {
		// create config file at root of workspace
		const { warnings, errors } = await tryAutoGenProjectSettings({
			nodeishFs,
			pathJoin: path.join,
			filePath: projectFilePath,
		})

		// Log warnings and errors
		for (const warning of warnings) console.warn(warning)
		if (errors) {
			for (const error of errors) console.error(error)
		}

		console.info(`🎉 Created project.inlang.json file at ${projectFilePath}`)
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
 * Prompts the user to create a config file.
 * @returns A promise that resolves to a string representing the user's choice ("Accept" or "Reject").
 */
const promptUserToCreateConfigFile = async (): Promise<string | undefined> => {
	return await vscode.window.showInformationMessage(
		"Inlang can be automatically setup for this project. Should the settings file be created?",
		"Accept",
		"Reject"
	)
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
