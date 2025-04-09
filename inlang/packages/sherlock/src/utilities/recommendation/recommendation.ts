import * as vscode from "vscode"
import { capture } from "../../services/telemetry/index.js"
import * as Sherlock from "@inlang/recommend-sherlock"
import { CONFIGURATION } from "../../configuration.js"
import type { FileSystem } from "../fs/createFileSystemMapper.js"

export function createRecommendationView(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: FileSystem
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
							await Sherlock.add({
								fs: args.fs,
								workingDirectory: args.workspaceFolder.uri.fsPath,
							})

							capture({
								event: "IDE-EXTENSION recommendation: add Sherlock to workspace",
								properties: { outcome: "Accepted" },
							})

							CONFIGURATION.EVENTS.ON_DID_RECOMMENDATION_VIEW_CHANGE.fire()
						}
						break
				}
			})

			// Load the webview content initially
			await updateRecommendationViewHtml(webviewView, args)

			// Listen for updates and debounce rapid events
			const debouncedUpdate = debounce(() => updateRecommendationViewHtml(webviewView, args), 300)

			const disposableEvent = CONFIGURATION.EVENTS.ON_DID_RECOMMENDATION_VIEW_CHANGE.event(
				async () => {
					debouncedUpdate()
				}
			)

			// Dispose the listener when the view is disposed
			webviewView.onDidDispose(() => {
				disposableEvent.dispose()
			})
		},
	}
}

async function updateRecommendationViewHtml(
	webviewView: vscode.WebviewView,
	args: {
		workspaceFolder: vscode.WorkspaceFolder
		context: vscode.ExtensionContext
		fs: FileSystem
	}
) {
	webviewView.webview.html = await getRecommendationViewHtml({
		webview: webviewView.webview,
		workspaceFolder: args.workspaceFolder,
		context: args.context,
		fs: args.fs,
	})
}

export async function getRecommendationViewHtml(args: {
	webview: vscode.Webview
	workspaceFolder: vscode.WorkspaceFolder
	context: vscode.ExtensionContext
	fs: FileSystem
}): Promise<string> {
	const shouldRecommendSherlock = await Sherlock.shouldRecommend({
		fs: args.fs,
		workingDirectory: args.workspaceFolder.uri.fsPath,
	})
	const isAdoptedSherlock = await Sherlock.isAdopted({
		fs: args.fs,
		workingDirectory: args.workspaceFolder.uri.fsPath,
	})

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
				shouldRecommendSherlock || isAdoptedSherlock
					? `<span>To improve your i18n workflow:</span>
					${
						shouldRecommendSherlock
							? `<div class="item active" id="addSherlockToWorkspace"><span class="codicon codicon-add"></span><span>Add Sherlock to this VS Code workspace</span></div>`
							: isAdoptedSherlock
								? `<div class="item"><span class="codicon codicon-pass-filled"></span><span>Sherlock is recommended in this VS Code workspace.</span></div>`
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
			</script>
		</body>
		</html>`
}

let recommendationBannerProvider: vscode.Disposable | undefined

export async function recommendationBannerView(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
	fs: FileSystem
}) {
	// Check if the provider is already registered
	if (recommendationBannerProvider) {
		console.log("Disposing existing Webview View provider for 'recommendationBanner'")
		recommendationBannerProvider.dispose()
	}

	// Register the Webview View provider
	recommendationBannerProvider = vscode.window.registerWebviewViewProvider(
		"recommendationBanner",
		createRecommendationView({
			fs: args.fs,
			context: args.context,
			workspaceFolder: args.workspaceFolder,
		})
	)
}

const debounce = <T extends (...args: any[]) => void>(
	fn: T,
	delay: number
): ((...args: Parameters<T>) => void) => {
	let timeout: NodeJS.Timeout
	return (...args: Parameters<T>) => {
		clearTimeout(timeout)
		timeout = setTimeout(() => fn(...args), delay)
	}
}
