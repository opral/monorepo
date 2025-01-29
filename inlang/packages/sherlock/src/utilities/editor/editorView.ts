import * as vscode from "vscode"
import { state } from "../state.js"
import { CONFIGURATION } from "../../configuration.js"
import { getSelectedBundleByBundleIdOrAlias } from "../helper.js"
import { msg } from "../messages/msg.js"
import type { BundleNested, Match } from "@inlang/sdk"
import { updateBundleNested } from "@inlang/sdk"

type Pattern =
	| { type: "text"; value: string }
	| {
			type: "expression"
			arg: { type: "variable-reference"; name: string } | { type: "literal"; value: string }
			annotation?: {
				type: "function-reference"
				name: string
				options: Array<{
					value: { type: "variable-reference"; name: string } | { type: "literal"; value: string }
					name: string
				}>
			}
	  }

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

	panel.webview.onDidReceiveMessage(
		async (message: {
			command: string
			bundle: {
				entityId: string
				entity: "variant"
				newData: {
					id: string
					messageId: string
					matches: Array<{ type: string; key: string }>
					pattern: Array<{ type: string; value?: string }>
				}
			}
		}) => {
			console.log("message", message)
			switch (message.command) {
				case "updateBundle":
					try {
						const originalBundle = await getSelectedBundleByBundleIdOrAlias(args.bundleId)
						if (!originalBundle) {
							throw new Error(`Bundle with id ${args.bundleId} not found`)
						}

						if (message.bundle.newData) {
							state()
								.project?.db.insertInto(message.bundle.entity)
								.values({
									...message.bundle.newData,
									// @ts-expect-error - we need to remove the nesting
									messages: undefined,
									variants: undefined,
								})
								.onConflict((oc) =>
									oc.column("id").doUpdateSet({
										...message.bundle.newData,
										// @ts-expect-error - we need to remove the nesting
										messages: undefined,
										variants: undefined,
									})
								)
								.execute()
						} else {
							state()
								.project?.db.deleteFrom(message.bundle.entity)
								.where("id", "=", message.bundle.entityId)
								.execute()
						}

						CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire()
						msg("Bundle updated successfully.")
					} catch (e) {
						console.log(`Couldn't update bundle. ${e}`, "error")
						console.error(e)
					}

					CONFIGURATION.EVENTS.ON_DID_EDITOR_VIEW_CHANGE.fire()
					break
			}
		}
	)
}

export async function getWebviewContent(args: {
	bundle: BundleNested
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): Promise<string> {
	const { context, webview, bundle } = args

	// Paths to local scripts and styles
	const styleUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, "assets", "editor-view.css")
	)

	const scriptUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, "assets", "editor-component.js")
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
		<!-- Include other component scripts -->
	</head>
	<body>
		<div id="bundle-container"></div>
		<script type="module">
			// Initialize VSCode API
			const vscode = acquireVsCodeApi();
	
			// Function to create and append elements with slots
			function createInlangComponents(bundle, messages) {
				const bundleContainer = document.getElementById('bundle-container');
				const bundleElement = document.createElement('inlang-bundle');
				bundleElement.bundle = bundle;
				bundleElement.messages = messages;
	
				// Listen for change events
				bundleElement.addEventListener('change', (event) => {
					vscode.postMessage({
						command: 'updateBundle',
						bundle: event.detail // Contains the updated bundle information
					});
				});
	
				// Append bundleElement to container
				bundleContainer.appendChild(bundleElement);
	
				// Dynamically create and append messages
				messages.forEach(message => {
					const messageElement = document.createElement('inlang-message');
					messageElement.setAttribute('slot', 'message');
					messageElement.message = message;
					messageElement.settings = {}; // Replace with actual settings if needed
	
					// Dynamically create and append variants
					message.variants.forEach(variant => {
						const variantElement = document.createElement('inlang-variant');
						variantElement.setAttribute('slot', 'variant');
						variantElement.variant = variant;
	
						// Create and append pattern-editor
						const patternEditor = document.createElement('inlang-pattern-editor');
						patternEditor.setAttribute('slot', 'pattern-editor');
						patternEditor.variant = variant;
						variantElement.appendChild(patternEditor);
	
						// Conditional rendering based on selectors and variants
						if ((message.selectors.length === 0 && message.variants.length <= 1) || !message.selectors) {	
							// Add selector button and dialog
							const variantActionDiv = document.createElement('div');
							variantActionDiv.setAttribute('slot', 'variant-action');
							variantActionDiv.textContent = 'Add selector';
							variantActionDiv.addEventListener('click', handleSelectorModal);
							variantElement.appendChild(variantActionDiv);
	
							const variantActionDialog = document.createElement('sl-dialog');
							variantActionDialog.setAttribute('slot', 'variant-action');
							variantActionDialog.setAttribute('label', 'Add Selector');
	
							const addSelector = document.createElement('inlang-add-selector');
							addSelector.message = message;
							addSelector.messages = messages;
							variantActionDialog.appendChild(addSelector);
	
							variantElement.appendChild(variantActionDialog);
						}
	
						// Append variant to message
						messageElement.appendChild(variantElement);
					});
	
					// // Add selector button and dialog to message
					// const selectorButtonDiv = document.createElement('div');
					// selectorButtonDiv.setAttribute('slot', 'selector-button');
					// selectorButtonDiv.classList.add('add-selector');
					// selectorButtonDiv.textContent = 'Add selector';
					// selectorButtonDiv.addEventListener('click', handleSelectorModal);
					// messageElement.appendChild(selectorButtonDiv);
	
					// const selectorButtonDialog = document.createElement('sl-dialog');
					// selectorButtonDialog.setAttribute('slot', 'selector-button');
					// selectorButtonDialog.setAttribute('label', 'Add Selector');
	
					// const addSelectorDialog = document.createElement('inlang-add-selector');
					// addSelectorDialog.message = message;
					// addSelectorDialog.messages = messages;
					// selectorButtonDialog.appendChild(addSelectorDialog);
	
					// messageElement.appendChild(selectorButtonDialog);
	
					// Append message to bundle
					bundleElement.appendChild(messageElement);
				});
			}
	
			// Handle messages from VSCode
			window.addEventListener('message', event => {
				const message = event.data; // The JSON data our extension sent
	
				switch (message.command) {
					case 'updateBundle':
						// Handle bundle update
						console.log('Bundle updated:', message.bundle);
						break;
					// Handle other commands
				}
			});
	
			// Function to handle selector modal (placeholder)
			function handleSelectorModal(event) {
				// Implement modal handling logic here
				console.log('Selector modal triggered');
			}
	
			// Render the components with initial data
			const initialBundle = ${JSON.stringify(bundle)};
			const initialMessages = ${JSON.stringify(bundle.messages)};
			createInlangComponents(initialBundle, initialMessages);
		</script>
	</body>
	</html>`
}
