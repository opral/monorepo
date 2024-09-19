import * as vscode from "vscode"
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { getSelectedBundleByBundleIdOrAlias } from "../helper.js"
import { msg } from "../messages/msg.js"
import type { BundleNested } from "@inlang/sdk2"

export async function editorView(args: { bundleId: string; context: vscode.ExtensionContext }) {
	const bundle = await getSelectedBundleByBundleIdOrAlias(args.bundleId)

	if (!bundle) {
		return msg("Bundle with id " + args.bundleId + " not found.", "error")
	}

	const panel = vscode.window.createWebviewPanel(
		"bundlePanel",
		state().selectedProjectPath.split("/").pop() ?? "Bundle",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(args.context.extensionPath)],
		}
	)

	panel.webview.html = await getWebviewContent({
		bundle,
		context: args.context,
		webview: panel.webview,
	})

	panel.webview.onDidReceiveMessage(async (message) => {
		console.log("message", message)
		switch (message.command) {
			case "updateBundle":
				// TODO: Update the bundle in the database
				// try {
				// 	await state()
				// 		.project.db.transaction()
				// 		.execute(async (trx) => {
				// 			await trx
				// 				.updateTable("message")
				// 				.set({
				// 					declarations: messageObj.declarations,
				// 					selectors: messageObj.selectors,
				// 				})
				// 				.where("message.id", "=", messageObj.id)
				// 				.execute()

				// 			await trx
				// 				.updateTable("variant")
				// 				.set({
				// 					pattern: variant.pattern,
				// 				})
				// 				.where("variant.id", "=", variant.id)
				// 				.execute()
				// 		})

				// 	CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()

				// 	msg("Message updated.")
				// } catch (e) {
				// 	msg(`Couldn't update bundle with id ${bundleId}. ${e}`)
				// }

				CONFIGURATION.EVENTS.ON_DID_EDITOR_VIEW_CHANGE.fire()

				break
		}
	})
}

export async function getWebviewContent(args: {
	bundle: BundleNested
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): Promise<string> {
	const { context, webview, bundle } = args

	// Paths to local scripts and styles
	const styleUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, "assets", "bundle-view.css")
	)

	const scriptUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, "assets", "bundle-component.mjs")
	)

	const litHtmlUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, "assets", "lit-html.js")
	)

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Inlang Bundle</title>
    <link href="${styleUri}" rel="stylesheet">
    <script type="module" src="${litHtmlUri}"></script>
    <script type="module" src="${scriptUri}"></script>
</head>
<body>
    <div id="bundle-container"></div>
    <script type="module">
        import {html, render} from '${litHtmlUri}';
        const vscode = acquireVsCodeApi();

        // RENDER WEB COMPONENT
        const bundleContainer = document.getElementById('bundle-container');
        const bundleElement = document.createElement('inlang-bundle');
        bundleElement.bundle = ${JSON.stringify(bundle)};
        bundleElement.messages = ${JSON.stringify(bundle.messages)};

        bundleContainer.appendChild(bundleElement);

        // EVENTS
        bundleElement.addEventListener('change', (event) => {
            vscode.postMessage({
                command: 'updateBundle',
                bundle: event.detail // Contains the updated bundle information
            });
        });
    </script>
</body>
</html>`
}
