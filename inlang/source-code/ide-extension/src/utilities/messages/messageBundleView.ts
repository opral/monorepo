import * as vscode from "vscode"
import { state } from "../state.js"

import {
	createMockBundleLintReport,
	createMockMessageLintReport,
	createMockVariantLintReport,
} from "@inlang/sdk/v2-mocks"
import { type MessageBundle, type LintReport } from "@inlang/sdk/v2"

//
// TODO: REPLACE THIS
//

const mockMessageLintReports: LintReport[] = [
	createMockBundleLintReport({
		ruleId: "messageBundleLintRule.inlang.missingMessage",
		messageBundleId: "mock_bundle_human_id",
		locale: "de",
		body: "The bundle `mock_bundle_human_id` is missing message for the locale `de`",
	}),
	createMockMessageLintReport({
		ruleId: "messageBundleLintRule.inlang.missingReference",
		messageBundleId: "mock_bundle_human_id",
		messageId: "mock_message_id_en",
		locale: "en",
		body: "The bundle `mock_bundle_human_id` is missing the reference message for the locale `en`",
	}),
	createMockMessageLintReport({
		ruleId: "messageBundleLintRule.inlang.missingReference",
		messageBundleId: "mock_bundle_human_id",
		messageId: "mock_message_id_en",
		locale: "en",
		body: "The bundle `mock_bundle_human_id` is missing the reference message for the locale `en`",
	}),
]

const mockVariantLintReports: LintReport[] = [
	createMockVariantLintReport({
		ruleId: "messageBundleLintRule.inlang.missingMessage",
		messageBundleId: "mock_bundle_human_id",
		variantId: "mock_variant_id_de_one",
		locale: "de",
		body: "The variant `one` is broken for the locale `de`",
	}),
]

const bundleWithoutSelectors: MessageBundle = {
	id: "message-bundle-id",
	messages: [
		{
			id: "message-id",
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				{
					id: "variant-id",
					match: [],
					pattern: [{ type: "text", value: "{count} new messages" }],
				},
			],
		},
	],
	alias: {
		default: "alias",
	},
}

//
// REPLACE THIS
//

export async function messageBundlePanel(args: {
	context: vscode.ExtensionContext
	id: MessageBundle["id"]
}) {
	const panel = vscode.window.createWebviewPanel(
		"messageBundlePanel",
		state().selectedProjectPath.split("/").pop() ?? "Settings",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(args.context.extensionPath)],
		}
	)

	panel.webview.html = getWebviewContent({
		id: args.id,
		context: args.context,
		webview: panel.webview,
	})

	panel.webview.onDidReceiveMessage(async (message) => {
		switch (message.command) {
			case "setMessageBundle":
				console.info("Received message", message)
				break
			case "setFixLint":
				console.info("Received fix lint", message)
				break
		}
	})
}

export function getWebviewContent(args: {
	id: MessageBundle["id"]
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): string {
	const styleUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "messagebundle-view.css")
	)

	const scriptUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "messagebundle-component.mjs")
	)

	const litHtmlUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "lit-html.js")
	)

	const settings = state().project.settings()

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
				<h1>Edit message</h1>
				<div id="message-bundle-container"></div>
			<main>
            <script type="module">
                import {html, render} from '${litHtmlUri}';
                const vscode = acquireVsCodeApi();
                
                // RENDER WEB COMPONENT
                const messageBundleContainer = document.getElementById('message-bundle-container');
                const messageBundleElement = document.createElement('inlang-message-bundle');
                messageBundleElement.messageBundle = ${JSON.stringify(bundleWithoutSelectors)};
                messageBundleElement.lintReports = ${JSON.stringify([
									...mockMessageLintReports,
									...mockVariantLintReports,
								])};
                messageBundleElement.settings = ${JSON.stringify(settings)};

                messageBundleContainer.appendChild(messageBundleElement);

                // EVENTS
                document.querySelector('inlang-message-bundle').addEventListener('change-message-bundle', (event) => {
                    vscode.postMessage({
                        command: 'setMessageBundle',
                        messageBundle: event.detail.argument
                    });
                });
				document.querySelector('inlang-message-bundle').addEventListener('fix-lint', (event) => {
                    vscode.postMessage({
                        command: 'setFixLint',
                        fix: event.detail.argument
                    });
                });
            </script>
        </body>
        </html>`
}
