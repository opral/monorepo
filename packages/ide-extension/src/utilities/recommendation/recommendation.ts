import * as vscode from "vscode"
import { telemetry } from "../../services/telemetry/implementation.js"
import { getGitOrigin } from "../settings/getGitOrigin.js"
import { getSetting, updateSetting } from "../settings/index.js"
import * as Sherlock from "@inlang/recommend-sherlock"
import * as Ninja from "@inlang/recommend-ninja"
import type { NodeishFilesystem } from "@lix-js/fs"

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

export function createRecommendationBanner(args: {
	workspaceFolder: vscode.WorkspaceFolder
	fs: NodeishFilesystem
}) {
	return {
		async resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: true,
			}

			webviewView.webview.onDidReceiveMessage(async (message) => {
				switch (message.command) {
					case "addSherlockToWorkspace":
						if (args.workspaceFolder) {
							Sherlock.add({
								fs: args.fs,
								workingDirectory: args.workspaceFolder.uri.fsPath,
							})

							// Hide the banner
							vscode.commands.executeCommand(
								"setContext",
								"sherlock:showRecommendationBanner",
								false
							)
						}
						break
					case "addNinjaGithubAction":
						if (await Ninja.shouldRecommend({ fs: args.fs })) {
							Ninja.add({ fs: args.fs })
						}
				}

				// Track the outcome
				telemetry.capture({
					event: "IDE-EXTENSION completed add to workspace recommendations",
					// if the user does not react, the outcome is undefined aka "Ignored"
					properties: { outcome: message.command === "addRecommendation" ? "Accepted" : "Ignored" },
				})
			})

			webviewView.webview.html = await getRecommendationBannerHtml({
				webview: webviewView.webview,
				fs: args.fs,
			})
		},
	}
}

export async function getRecommendationBannerHtml(args: {
	webview: vscode.Webview
	fs: NodeishFilesystem
}): Promise<string> {
	const shouldRecommendNinja = await Ninja.shouldRecommend({ fs: args.fs })
	const shouldRecommendSherlock = await Sherlock.shouldRecommend({ fs: args.fs })

	return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${
							args.webview.cspSource
						}; style-src ${args.webview.cspSource} 'unsafe-inline'; script-src ${
		args.webview.cspSource
	} 'unsafe-inline';">
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
				${
					shouldRecommendSherlock
						? `// Add Sherlock to workspace recommendation
                <span>Add the extension to be recommended for other users of your current workspace.</span>
                <button id="addSherlockToWorkspace">Add to workspace recommendation</button>
						`
						: ``
				}
				${
					shouldRecommendNinja
						? `// Add Ninja Github Action Button
				<span>Add Ninja Github Action to lint translations in CI</span>
				<button id="addNinjaGithubAction">Add Ninja Github Action</button>
						`
						: ``
				}
			</main>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('addSherlockToWorkspace').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'addSherlockToWorkspace'
                    });
                });
				document.getElementById('addNinjaGithubAction').addEventListener('click', () => {
					vscode.postMessage({
						command: 'addNinjaGithubAction'
					});
				});
            </script>
        </body>
        </html>`
}

export async function recommendationBannerView(args: {
	workspaceFolder: vscode.WorkspaceFolder
	nodeishFs: NodeishFilesystem
}) {
	vscode.window.registerWebviewViewProvider(
		"recommendationBanner",
		createRecommendationBanner({
			fs: args.nodeishFs,
			workspaceFolder: args.workspaceFolder,
		})
	)
}
