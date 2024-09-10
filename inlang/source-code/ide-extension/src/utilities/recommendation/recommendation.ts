import * as vscode from "vscode"
import { telemetry } from "../../services/telemetry/index.js"
import * as Sherlock from "@inlang/recommend-sherlock"
import * as Ninja from "@inlang/recommend-ninja"
import { CONFIGURATION } from "../../configuration.js"

export function createRecommendationView(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: typeof import("node:fs/promises")
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

							telemetry.capture({
								event: "IDE-EXTENSION recommendation: add Sherlock to workspace",
								properties: { outcome: "Accepted" },
							})

							CONFIGURATION.EVENTS.ON_DID_RECOMMENDATION_VIEW_CHANGE.fire()
						}
						break
					case "addNinjaGithubAction":
						Ninja.add({ fs: args.fs })

						telemetry.capture({
							event: "IDE-EXTENSION recommendation: add Ninja Github Action workflow to repository",
							properties: { outcome: "Accepted" },
						})

						CONFIGURATION.EVENTS.ON_DID_RECOMMENDATION_VIEW_CHANGE.fire()
						break
				}
			})

			webviewView.webview.html = await getRecommendationViewHtml({
				webview: webviewView.webview,
				workspaceFolder: args.workspaceFolder,
				context: args.context,
				fs: args.fs,
			})

			// Listen for updates
			CONFIGURATION.EVENTS.ON_DID_RECOMMENDATION_VIEW_CHANGE.event(async () => {
				webviewView.webview.html = await getRecommendationViewHtml({
					webview: webviewView.webview,
					workspaceFolder: args.workspaceFolder,
					context: args.context,
					fs: args.fs,
				})
			})
		},
	}
}

export async function getRecommendationViewHtml(args: {
	webview: vscode.Webview
	workspaceFolder: vscode.WorkspaceFolder
	context: vscode.ExtensionContext
	fs: typeof import("node:fs/promises")
}): Promise<string> {
	const shouldRecommendNinja = await Ninja.shouldRecommend({ fs: args.fs })
	const shouldRecommendSherlock = await Sherlock.shouldRecommend({
		fs: args.fs,
		workingDirectory: args.workspaceFolder.uri.fsPath,
	})
	const isAdoptedSherlock = await Sherlock.isAdopted({
		fs: args.fs,
		workingDirectory: args.workspaceFolder.uri.fsPath,
	})
	const isAdoptedNinja = await Ninja.isAdopted({ fs: args.fs })

	const codiconsUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "codicon.css")
	)
	const codiconsTtfUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "codicon.ttf")
	)

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
			<link href="${codiconsUri}" rel="stylesheet">
			<link href="${codiconsTtfUri}" rel="stylesheet">
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
				.container {
					display: flex;
					flex-direction: column;
					width: 100%;
					gap: 2px;
				}
				.item {
					display: flex;
					flex-direction: row;
					align-items: center;
					gap: 3px;
				}
				.item.active:hover {
					cursor: pointer;
				}
				h1 {
					font-size: 12px;
					text-weight: bold;
				}
				span {
					display: block;
					font-size: 12px;
					line-height: 1.2;
					margin-bottom: 5px;
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
			
			<div class="container">
			${
				shouldRecommendSherlock || shouldRecommendNinja || isAdoptedSherlock || isAdoptedNinja
					? `<span>To improve your i18n workflow:</span>
					${
						shouldRecommendSherlock
							? `<div class="item active" id="addSherlockToWorkspace"><span class="codicon codicon-add"></span><span>Add Sherlock to this VS Code workspace</span></div>`
							: isAdoptedSherlock
								? `<div class="item"><span class="codicon codicon-pass-filled"></span><span>Sherlock is recommended in this VS Code workspace.</span></div>`
								: ``
					}
				${
					shouldRecommendNinja
						? `<div class="item active" id="addNinjaGithubAction"><span class="codicon codicon-add"></span><span>Add Ninja Github Action workflow to this repository</span></div>`
						: isAdoptedNinja
							? `<div class="item"><span class="codicon codicon-pass-filled"></span><span>Ninja Github Action workflow is installed.</span></div>`
							: ``
				}`
					: `No recommendations available.`
			}

				</div>
			</main>
            <script>
                const vscode = acquireVsCodeApi();
                ${
									shouldRecommendSherlock &&
									`document.getElementById('addSherlockToWorkspace').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'addSherlockToWorkspace'
                    });
                });`
								}
				${
					shouldRecommendNinja &&
					`document.getElementById('addNinjaGithubAction').addEventListener('click', () => {
					vscode.postMessage({
						command: 'addNinjaGithubAction'
					});
				});`
				}
			</script>
		</body>
		</html>`
}

export async function recommendationBannerView(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: typeof import("node:fs/promises")
}) {
	return vscode.window.registerWebviewViewProvider(
		"recommendationBanner",
		createRecommendationView({
			fs: args.fs,
			context: args.context,
			workspaceFolder: args.workspaceFolder,
		})
	)
}
