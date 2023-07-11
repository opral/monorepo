import { getSetting, updateSetting } from "./settings/index.js"
import * as vscode from "vscode"
import * as path from "node:path"
import * as fs from "node:fs"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"

/**
 * Displays an popup to add the Inlang extension to your recommendation.
 * @param {vscode.WorkspaceFolder} args.workspaceFolder - The workspace folder.
 * @returns {Promise<void>} - A Promise that resolves once the recommendation process is completed.
 */
export async function inWorkspacerecommendation(args: { workspaceFolder: vscode.WorkspaceFolder }) {
	const vscodeFolderPath = path.join(args.workspaceFolder.uri.fsPath, ".vscode")
	const extensionsJsonPath = path.join(vscodeFolderPath, "extensions.json")

	let extensions: { recommendations: string[] } | undefined

	// Read the extensions.json file
	if (fs.existsSync(extensionsJsonPath) && fs.existsSync(vscodeFolderPath)) {
		extensions = JSON.parse(fs.readFileSync(extensionsJsonPath, "utf8"))
	}
	console.log("Ich bin die Zwei", extensions)
	if (!extensions || !extensions.recommendations.includes("inlang.vs-code-extension")) {
		return false
	} else if (extensions.recommendations.includes("inlang.vs-code-extension")) {
		return true
	}
}
export const recommendation = async (args: {
	workspaceFolder: vscode.WorkspaceFolder
}): Promise<void> => {
	// check if the showRecommendation setting is set to false
	if (await isDisabledRecommendation()) {
		return
	}
	const vscodeFolderPath = path.join(args.workspaceFolder.uri.fsPath, ".vscode")
	const extensionsJsonPath = path.join(vscodeFolderPath, "extensions.json")

	console.log(
		"was bin ich",
		await inWorkspacerecommendation({ workspaceFolder: args.workspaceFolder }),
	)

	// If not already recommended
	if ((await inWorkspacerecommendation({ workspaceFolder: args.workspaceFolder })) === false) {
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
			const newExtensions = JSON.parse(fs.readFileSync(extensionsJsonPath, "utf8"))
			newExtensions.recommendations.push("inlang.vs-code-extension")

			// Write the updated extensions.json file
			fs.writeFileSync(extensionsJsonPath, JSON.stringify(newExtensions, undefined, 2))
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
