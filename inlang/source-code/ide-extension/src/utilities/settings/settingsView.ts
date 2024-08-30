import * as vscode from "vscode"
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"

export async function settingsPanel(args: { context: vscode.ExtensionContext }) {
	const panel = vscode.window.createWebviewPanel(
		"settingsPanel",
		state().selectedProjectPath.split("/").pop() ?? "Settings",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(args.context.extensionPath)],
		}
	)

	panel.webview.html = getWebviewContent({
		context: args.context,
		webview: panel.webview,
	})

	panel.webview.onDidReceiveMessage(async (message) => {
		switch (message.command) {
			case "setSettings":
				state().project.settings.set(message.settings)
				CONFIGURATION.EVENTS.ON_DID_SETTINGS_VIEW_CHANGE.fire()
				break
		}
	})
}

export function getWebviewContent(args: {
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): string {
	const styleUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "settings-view.css")
	)

	const scriptUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "settings-component.mjs")
	)

	const litHtmlUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "lit-html.js")
	)

	const settings = state().project.settings.get()
	const installedPlugins = state().project.plugins.get()
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
