import { getSetting, updateSetting } from "./settings/index.js"
import * as vscode from "vscode"
import * as path from "node:path"
import * as fs from "node:fs"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"
import { parse, stringify } from "comment-json"

/**
 * Defines the structure of the extensions.json file.
 */
type ExtensionsJson = {
	recommendations: string[]
}

/**
 * Displays an popup to add the Inlang extension to your recommendation.
 * @param {vscode.WorkspaceFolder} args.workspaceFolder - The workspace folder.
 * @returns {Promise<void>} - A Promise that resolves once the recommendation process is completed.
 */
export const recommendation = async (args: {
	workspaceFolder: vscode.WorkspaceFolder
}): Promise<void> => {
	// check if the showRecommendation setting is set to false
	if (await isDisabledRecommendation()) {
		return
	}

	const vscodeFolderPath = path.join(args.workspaceFolder.uri.fsPath, ".vscode")
	const extensionsJsonPath = path.join(vscodeFolderPath, "extensions.json")

	let extensions: ExtensionsJson | undefined
	// Read the extensions.json file
	if (fs.existsSync(extensionsJsonPath) && fs.existsSync(vscodeFolderPath)) {
		extensions = parse(fs.readFileSync(extensionsJsonPath, "utf8")) as any
	}

	// If not already recommended
	if (!extensions || !extensions.recommendations.includes("inlang.vs-code-extension")) {
		// Prompt the user to install the Inlang extension
		const installInlangExtension = await vscode.window.showInformationMessage(
			"The Inlang extension is recommended for this project. Do you want to add it to your recommendations?",
			"Accept",
			"Reject",
		)

		if (installInlangExtension === "Accept") {
			// Check if the .vscode folder exists
			if (!fs.existsSync(vscodeFolderPath)) {
				fs.mkdirSync(vscodeFolderPath)
			}

			// Check if the extensions.json file exists
			if (!fs.existsSync(extensionsJsonPath)) {
				// Create a new extensions.json file with an empty recommendations array
				fs.writeFileSync(extensionsJsonPath, JSON.stringify({ recommendations: [] }, undefined, 2))
			}

			// Add the Inlang extension to the recommendations object
			const newExtensions: ExtensionsJson = parse(
				fs.readFileSync(extensionsJsonPath, "utf8"),
			) as any
			newExtensions.recommendations.push("inlang.vs-code-extension")

			// Write the updated extensions.json file
			fs.writeFileSync(extensionsJsonPath, stringify(newExtensions, undefined, 2))
		} else if (installInlangExtension === "Reject") {
			// persist the user's choice in a workspace setting
			await updateDisabledRecommendation()
		}

		// Track the outcome
		telemetry.capture({
			event: "IDE-EXTENSION completed add to workspace recommendations",
			// if the user does not react, the outcome is undefined aka "Ignored"
			properties: { outcome: installInlangExtension ?? "Ignored" },
		})
	}
}

/**
 * Checks if the Inlang extension recommendation is disabled.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the recommendation is disabled, false otherwise.
 */
export const isDisabledRecommendation = async (): Promise<boolean> => {
	return (await getSetting("disableRecommendation")).includes(await getGitOrigin())
}

/**
 * Updates the configuration setting to disable the Inlang extension recommendation.
 * @returns {Promise<void>} - A Promise that resolves once the setting has been updated.
 */
const updateDisabledRecommendation = async (): Promise<void> => {
	await updateSetting("disableRecommendation", [
		...(await getSetting("disableRecommendation")),
		await getGitOrigin(),
	])
}
