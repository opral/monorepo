import * as vscode from "vscode"
import { state } from "../state.js"

export function createSettingsWebviewProvider(args: { context: vscode.ExtensionContext }) {
	return {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(args.context.extensionPath)],
			}

			// Set the HTML content for the webview
			webviewView.webview.html = getWebviewContent({
				context: args.context,
				webview: webviewView.webview,
			})
		},
	}
}

function getWebviewContent(args: {
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): string {
    const scriptUri = args.webview.asWebviewUri(
			vscode.Uri.joinPath(
				args.context.extensionUri,
				"node_modules",
				"@inlang",
				"settings-component",
				"dist",
				"index.mjs"
			)
		)

		const litHtmlUri = args.webview.asWebviewUri(
			vscode.Uri.joinPath(args.context.extensionUri, "node_modules", "lit-html", "lit-html.js")
		)

		const project = state().project

		return `<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Settings</title>
						<script type="module" src="${litHtmlUri}"></script>
						<script type="module" src="${scriptUri}"></script>
					</head>
					<body>
						<div id="settings-container"></div>
						<script type="module">
							import {html, render} from '${litHtmlUri}';
							const settingsContainer = document.getElementById('settings-container');
							const settingsTemplate = html\`
								<inlang-settings .project=${project}></inlang-settings>
							\`;
							render(settingsTemplate, settingsContainer);

							document.querySelector('inlang-settings').addEventListener('onSetSettings', (settings) => {
								console.log("save", settings);
							});
						</script>
					</body>
				</html>`
}

export async function settingsView(args: { context: vscode.ExtensionContext }) {
	const provider = createSettingsWebviewProvider({ ...args })

	args.context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("settingsView", provider)
	)
}
