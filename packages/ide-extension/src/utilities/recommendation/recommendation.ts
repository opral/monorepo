import * as vscode from "vscode"
import type { CommentJSONValue } from "comment-json/index.js"
import { parse, stringify } from "comment-json"
import * as path from "node:path"
import * as fs from "node:fs"
import { telemetry } from "../../services/telemetry/implementation.js"
import { getGitOrigin } from "../settings/getGitOrigin.js"
import { getSetting, updateSetting } from "../settings/index.js"

/**
 * Defines the structure of the extensions.json file.
 */
type ExtensionsJson = {
	recommendations: string[]
}

export async function isInWorkspaceRecommendation(args: {
	workspaceFolder: vscode.WorkspaceFolder
}) {
	const vscodeFolderPath = path.join(args.workspaceFolder.uri.fsPath, ".vscode")
	const extensionsJsonPath = path.join(vscodeFolderPath, "extensions.json")

	let extensions: CommentJSONValue | undefined
	// Read the extensions.json file
	if (fs.existsSync(extensionsJsonPath) && fs.existsSync(vscodeFolderPath)) {
		extensions = parse(fs.readFileSync(extensionsJsonPath, "utf8"))
	}
	const extensionsResult =
		// @ts-expect-error
		extensions?.recommendations?.includes("inlang.vs-code-extension") || false

	if (extensionsResult === true) {
		return true
	} else {
		return false
	}
}

export const isDisabledRecommendation = async (): Promise<boolean> => {
	const disabledRecommendations = await getSetting("disableRecommendation")
	const gitOrigin = await getGitOrigin()
	return disabledRecommendations ? disabledRecommendations.includes(gitOrigin) : false
}

export const updateDisabledRecommendation = async (): Promise<void> => {
	await updateSetting("disableRecommendation", [
		...(await getSetting("disableRecommendation")),
		await getGitOrigin(),
	])
}

export function createRecommendationBanner(args: { workspaceFolder: vscode.WorkspaceFolder }) {
	return {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: true,
			}

			webviewView.webview.onDidReceiveMessage(async (message) => {
				const vscodeFolderPath = path.join(args.workspaceFolder.uri.fsPath, ".vscode")
				const extensionsJsonPath = path.join(vscodeFolderPath, "extensions.json")

				switch (message.command) {
					case "addRecommendation":
						if (args.workspaceFolder) {
							// Check if the .vscode folder exists
							if (!fs.existsSync(vscodeFolderPath)) {
								fs.mkdirSync(vscodeFolderPath)
							}

							// Check if the extensions.json file exists
							if (!fs.existsSync(extensionsJsonPath)) {
								// Create a new extensions.json file with an empty recommendations array
								fs.writeFileSync(
									extensionsJsonPath,
									JSON.stringify({ recommendations: [] }, undefined, 2)
								)
							}

							// Add the Inlang extension to the recommendations object
							const newExtensions: ExtensionsJson = parse(
								fs.readFileSync(extensionsJsonPath, "utf8")
							) as any
							newExtensions.recommendations.push("inlang.vs-code-extension")

							// Write the updated extensions.json file
							fs.writeFileSync(extensionsJsonPath, stringify(newExtensions, undefined, 2))

							// Hide the banner
							vscode.commands.executeCommand("setContext", "inlang:showRecommendationBanner", false)
						}
						break
					case "rejectRecommendation":
						// persist the user's choice in a workspace setting
						await updateDisabledRecommendation()

						// Hide the banner
						vscode.commands.executeCommand("setContext", "inlang:showRecommendationBanner", false)
						break
				}

				// Track the outcome
				telemetry.capture({
					event: "IDE-EXTENSION completed add to workspace recommendations",
					// if the user does not react, the outcome is undefined aka "Ignored"
					properties: { outcome: message.command === "addRecommendation" ? "Accepted" : "Ignored" },
				})
			})

			webviewView.webview.html = getRecommendationBannerHtml({ webview: webviewView.webview })
		},
	}
}

export function getRecommendationBannerHtml(args: { webview: vscode.Webview }): string {
	return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${args.webview.cspSource}; style-src ${args.webview.cspSource} 'unsafe-inline'; script-src ${args.webview.cspSource} 'unsafe-inline';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recommendation</title>
			<style>
				body{
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				main {
					margin: 5px 10px;
				}
				h1 {
					font-size: 12px;
					text-weight: bold;
				}
				span {
					display: block;
					font-size: 12px;
					line-height: 1.2;
					margin-bottom: 10px;
				}
				button {
					color: var(--vscode-button-foreground);
					background-color: var(--vscode-button-background);
					border: none;
					padding: 6px 10px;
					width: 100%;
					text-align: center;
					text-decoration: none;
					display: inline-block;
					font-size: 12px;
					font-weight: bold;
					margin: 4px 2px;
					transition-duration: 0.4s;
					cursor: pointer;
					border-radius: 2px;
					margin-bottom: 10px;
				}
				
				button:hover {
					background-color: var(--vscode-button-secondaryHoverBackground);
				}

				ol, ul {
					margin-top: 5px;
				}

				li {
					font-size: 12px;
					margin-bottom: 5px;
				}

				.link {
					color: var(--vscode-sideBar-foreground);
					text-decoration: none;
				}

				.link:hover {
					color: var(--vscode-sideBar-foreground);
					text-decoration: underline;
					cursor: pointer;
				}
			</style>
        </head>
        <body>
            <main>
                <!--<span>Add the extension to be recommended for other users of your current workspace.</span>-->

                <button id="addRecommendation">Add to workspace recommendation</button>
                <!--<a id="rejectRecommendation" class="link"><span style="text-align: center;">Reject</a></span></a>-->
            </main>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('addRecommendation').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'addRecommendation'
                    });
                });
                document.getElementById('rejectRecommendation').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'rejectRecommendation'
                    });
                });
            </script>
        </body>
        </html>`
}

export async function recommendationBannerView(args: { workspaceFolder: vscode.WorkspaceFolder }) {
	if (
		(await isDisabledRecommendation()) ||
		(await isInWorkspaceRecommendation({ workspaceFolder: args.workspaceFolder }))
	) {
		return
	} else {
		vscode.commands.executeCommand("setContext", "inlang:showRecommendationBanner", true)
	}

	vscode.window.registerWebviewViewProvider(
		"recommendationBanner",
		createRecommendationBanner({
			workspaceFolder: args.workspaceFolder,
		})
	)
}
