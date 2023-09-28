import * as vscode from "vscode"
import { getGitOrigin } from "../services/telemetry/implementation.js"
import { getSetting, updateSetting } from "./settings/index.js"
import { CONFIGURATION } from "../configuration.js"

/**
 * Delete old inlang.config.js config file if new project.inlang.json exists.
 */
export const deleteOldConfigFile = async () => {
	// Check if old config file exists
	const oldConfigFiles = await vscode.workspace.findFiles("inlang.config.js")
	const newConfigFiles = await vscode.workspace.findFiles(CONFIGURATION.FILES.PROJECT)
	if (oldConfigFiles[0] && newConfigFiles[0]) {
		// Check if prompt is disabled
		if (await isDisabledConfigFileDeletion()) return

		// Prompt user to delete config file
		const deleteConfigFile = await promptUserToDeleteConfigFile()

		if (deleteConfigFile === "Accept") {
			// Delete old config file
			await vscode.workspace.fs.delete(oldConfigFiles[0])
			console.info(`🗑️ Deleted inlang.config.js file at ${oldConfigFiles[0].fsPath}`)
		} else if (deleteConfigFile === "Reject") {
			// Disable config file deletion
			disableConfigFileDeletion()
		}
	}
}

/**
 * Prompts the user to delete the old config file.
 */
const promptUserToDeleteConfigFile = async (): Promise<string | undefined> => {
	return await vscode.window.showInformationMessage(
		"Found an old inlang.config.js file, but a new project.inlang.json exists. Do you want to delete the inlang.config.js?",
		"Accept",
		"Reject",
	)
}

/**
 * Checks if the config file deletion is disabled based on the git origin.
 */
const isDisabledConfigFileDeletion = async (): Promise<boolean> => {
	return (await getSetting("disableConfigFileDeletion")).includes(await getGitOrigin())
}

/**
 * Update the setting to disable the config file deletion.
 * @param gitOrigin - The git origin.
 */
const disableConfigFileDeletion = async (): Promise<void> => {
	const gitOrigin = await getGitOrigin()
	try {
		await updateSetting("disableConfigFileDeletion", [
			...(await getSetting("disableConfigFileDeletion")),
			gitOrigin,
		])
	} catch (error) {
		console.error(`Could not update setting 'disableConfigFileDeletion'`)
		console.error(error)
	}
}
