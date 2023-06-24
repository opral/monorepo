import * as vscode from "vscode"
import * as path from "node:path"
import * as fs from "node:fs"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"

export const disableRecommendation = async (): Promise<boolean> => {
	const gitOrigin = await getGitOrigin()
	const _recommendation = vscode.workspace
		.getConfiguration("inlang")
		.get("disableRecommendation") as string[]
	return _recommendation.includes(gitOrigin)
}

export const recommendation = async (args: { workspaceFolder: vscode.WorkspaceFolder }) => {
	// check if the showRecommendation setting is set to false
	if (await disableRecommendation()) {
		return
	}

	const vscodeFolderPath = path.join(args.workspaceFolder.uri.fsPath, ".vscode")
	const extensionsJsonPath = path.join(vscodeFolderPath, "extensions.json")

	let extensions: { recommendations: string[] } | undefined

	// Read the extensions.json file
	if (fs.existsSync(extensionsJsonPath) && fs.existsSync(vscodeFolderPath)) {
		extensions = JSON.parse(fs.readFileSync(extensionsJsonPath, "utf8"))
	}

	// If not already recommended
	if (!extensions || !extensions.recommendations.includes("inlang.vs-code-extension")) {
		const _recommendation = vscode.workspace
			.getConfiguration("inlang")
			.get("disableRecommendation") as string[]
		const gitOrigin = await getGitOrigin()
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
		} else {
			// persist the user's choice in a workspace setting
			await vscode.workspace
				.getConfiguration("inlang")
				.update("disableRecommendation", [..._recommendation, gitOrigin], true)
		}

		// Track the outcome
		telemetry.capture({
			event: "IDE-EXTENSION completed add to workspace recommendations",
			// if the user does not react, the outcome is undefined aka "Ignored"
			properties: { outcome: installInlangExtension ?? "Ignored" },
		})
	}
}
