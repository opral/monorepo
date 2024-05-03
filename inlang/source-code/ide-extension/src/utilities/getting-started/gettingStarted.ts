import * as vscode from "vscode"
import { CONFIGURATION } from "../../configuration.js"
import { createNewProjectHandler } from "./createNewProjectHandler.js"

export function createNoProjectsFoundViewProvider(args: {
	workspaceFolder: vscode.WorkspaceFolder
}): vscode.WebviewViewProvider {
	return {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: true,
			}
			webviewView.webview.html = getNoProjectsFoundHtml()
			webviewView.webview.onDidReceiveMessage(
				async (message) => {
					switch (message.command) {
						case "createNewProject":
							await createNewProjectHandler({
								workspaceFolderPath: args.workspaceFolder.uri.fsPath,
							})
							// Refresh projects
							CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.fire(undefined)
							break
					}
				},
				undefined,
				[]
			)
		},
	}
}

export function getNoProjectsFoundHtml(): string {
	return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>No Projects Found</title>
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
					background-color: var(--vscode-button-hoverBackground);
				}

				ol, ul {
					margin-top: 5px;
				}

				li {
					font-size: 12px;
					margin-bottom: 5px;
				}
			</style>
        </head>
        <body>
			<main>
				<h1>No project found</h1>
				<span>Please create a project or make sure to have the correct workspace open.</span>
				<button onclick="createProject()">Create Project</button>
				<span style="text-align: center;">Or, see <a href="${CONFIGURATION.STRINGS.DOCS_URL}">documentation</a></span>
			</main>
			<script>
				const vscode = acquireVsCodeApi();
				function createProject() {
					vscode.postMessage({
						command: 'createNewProject'
					});
				}
        	</script>
        </body>
        </html>`
}

export async function gettingStartedView(args: { workspaceFolder: vscode.WorkspaceFolder }) {
	vscode.window.registerWebviewViewProvider(
		"gettingStartedView",
		createNoProjectsFoundViewProvider({
			workspaceFolder: args.workspaceFolder,
		})
	)
}
