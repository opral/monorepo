import * as vscode from "vscode"
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"

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

			// Immediately send the project data to the webview
			webviewView.webview.postMessage({ command: "setAppId", appId: CONFIGURATION.STRINGS.APP_ID })
			const projectPath = state().selectedProjectPath
			webviewView.webview.postMessage({ command: "setProjectPath", projectPath })
		},
	}
}

function getWebviewContent(args: {
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): string {
	const settingsComponentUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(
			args.context.extensionUri,
			"node_modules",
			"@inlang",
			"settings-component",
			"dist",
			"index.mjs"
		)
	)

	const inlangSdkUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(
			args.context.extensionUri,
			"node_modules",
			"@inlang",
			"sdk",
			"dist",
			"index.js"
		)
	)

	const lixFsUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(
			args.context.extensionUri,
			"node_modules",
			"@lix-js",
			"fs",
			"dist",
			"index.js"
		)
	)

	const lixClientUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(
			args.context.extensionUri,
			"node_modules",
			"@lix-js",
			"client",
			"dist",
			"index.js"
		)
	)

	return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Settings</title>
				<script type="module" src="${inlangSdkUri}"></script>
				<script type="module" src="${lixFsUri}"></script>
				<script type="module" src="${lixClientUri}"></script>
                <script type="module" src="${settingsComponentUri}"></script>
            </head>
            <body>
                <div id="settings-container"></div>
				<p id="current-date"></p>
				<script>
					document.addEventListener('DOMContentLoaded', () => {
						document.getElementById('current-date').textContent = new Date().toLocaleString();
					});
				</script>
				<script type="module">
					import {loadProject} from '${inlangSdkUri}';
					import {createNodeishMemoryFs} from '${lixFsUri}';
					import {openRepository, findRepoRoot} from '${lixClientUri}';

					console.log("repo", openRepository)
				
					const settingsContainer = document.getElementById('settings-container');
					let appId = "";
				
					window.addEventListener('message', event => {
						const message = event.data;
						if (message.command === 'setAppId') {
							appId = message.appId;
						}
						if (message.command === 'setProjectPath') {
							loadAndDisplayProject(message.projectPath);
						}
					});
				
					async function loadAndDisplayProject(projectPath) {
						try {
							const nodeishFs = createNodeishMemoryFs();

							const repo = await openRepository(
								(await findRepoRoot({
									nodeishFs,
									path: projectPath,
								})) || projectPath,
								{
									nodeishFs
								}
							)

							const project = await loadProject({
								projectPath: projectPath,
								appId: appId,
								// repo and _import need to be handled or mocked appropriately
							});
							updateSettings(project);
						} catch (error) {
							console.error('Failed to load project:', error);
							// Optionally, handle error by displaying a message in the webview
						}
					}
				
					function updateSettings(project) {
						const inlangSettingsElement = document.createElement('inlang-settings');
						inlangSettingsElement.project = project; // Dynamically set the project data
						settingsContainer.innerHTML = '';
						settingsContainer.appendChild(inlangSettingsElement);
					}
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
