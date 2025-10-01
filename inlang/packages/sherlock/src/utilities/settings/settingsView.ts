import * as vscode from "vscode"
import { safeState, state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { logger } from "../logger.js"

export async function settingsPanel(args: { context: vscode.ExtensionContext }) {
	const currentState = safeState()
	if (!currentState?.selectedProjectPath || !currentState?.project) {
		logger.warn("Settings panel requested before project was loaded")
		vscode.window.showWarningMessage(
			"Sherlock settings are unavailable because no project is currently loaded."
		)
		return
	}

	const panel = vscode.window.createWebviewPanel(
		"settingsPanel",
		currentState.selectedProjectPath.split("/").pop() ?? "Settings",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(args.context.extensionPath)],
		}
	)

	panel.webview.html = await getWebviewContent({
		context: args.context,
		webview: panel.webview,
	})

	panel.webview.onDidReceiveMessage(async (message) => {
		switch (message.command) {
			case "setSettings":
				const latestState = safeState()
				if (!latestState?.project) {
					logger.warn("Received settings update without an active project")
					return
				}
				latestState.project.settings.set(message.settings)
				CONFIGURATION.EVENTS.ON_DID_SETTINGS_VIEW_CHANGE.fire()
				break
		}
	})
}

export async function getWebviewContent(args: {
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): Promise<string> {
	const styleUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "settings-view.css")
	)

	const scriptUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "settings-component.js")
	)

	const litHtmlUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "lit-html.js")
	)

	const currentState = safeState()
	if (!currentState?.project) {
		logger.warn("Attempted to render settings view without a loaded project")
		return "<main><p>Project settings are unavailable because Sherlock has not finished loading a project.</p></main>"
	}

	const settings = await currentState.project.settings.get()
	const installedPlugins = await currentState.project.plugins.get()
	// TODO: Clarify how to derive validation rules from lix
	// const installedMessageLintRules = state().project.installed.messageLintRules()

	return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Settings</title>
            <link href="${styleUri}" rel="stylesheet" />
            <script type="module" src="${litHtmlUri}"></script>
            <script type="module" src="${scriptUri}"></script>
        </head>
        <body>
			<main>
				<h1>Project settings</h1>
				<div id="settings-container"></div>
			<main>
            <script type="module">
                import {html, render} from '${litHtmlUri}';
                const vscode = acquireVsCodeApi();
                
                // RENDER WEB COMPONENT
                const settingsContainer = document.getElementById('settings-container');
                const settingsElement = document.createElement('inlang-settings');
                settingsElement.installedPlugins = ${JSON.stringify(installedPlugins)};
                settingsElement.settings = ${JSON.stringify(settings)};

                settingsContainer.appendChild(settingsElement);

                // EVENTS
                document.querySelector('inlang-settings').addEventListener('set-settings', (event) => {
                    vscode.postMessage({
                        command: 'setSettings',
                        settings: event.detail.argument
                    });
                });
            </script>
        </body>
        </html>`
}
