import * as vscode from "vscode"
import { state } from "../../state.js"
import type { Message } from "@inlang/sdk"

export function createMessageWebviewProvider(args: { context: vscode.ExtensionContext }) {
	return {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: true,
			}

			const messages = state().project.query.messages.getAll()
			const activeEditor = vscode.window.activeTextEditor
			let fileContent = ""

			if (activeEditor) {
				const document = activeEditor.document
				fileContent = document.getText()
			}

			const highlightedMessages = messages.filter((message) => fileContent.includes(message.id))
			const highlightedMessagesHtml =
				highlightedMessages.length > 0
					? `<div class="highlighted-section">${highlightedMessages
							.map((message) => createMessageHtml({ message, isHighlighted: true }))
							.join("")}</div>`
					: ""

			const messageListHtml = messages
				.map((message) => createMessageHtml({ message, isHighlighted: false }))
				.join("")

			webviewView.webview.html = getHtml({
				highlightedContent: highlightedMessagesHtml,
				mainContent: messageListHtml,
				context: args.context,
				webview: webviewView.webview,
			})
		},
	}
}

function createMessageHtml(args: { message: Message; isHighlighted: boolean }): string {
	const highlightedStyle = args.isHighlighted
		? 'style="background-color: rgba(147, 112, 219, 0.1);"'
		: ""
	return `
        <div class="tree-item" ${highlightedStyle}>
            <button class="collapsible">
                <span class="codicon codicon-note"></span><span>${args.message.id}<span>
            </button>
            <div class="content" style="display: none;">
                <p>Source language tag: ${"en"}</p>
                <button class="copy-btn" data-message-id="${args.message.id}">Copy ID</button>
            </div>
        </div>
    `
}

function getHtml(args: {
	highlightedContent: string
	mainContent: string
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): string {
	const styleUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "styles.css")
	)
	const codiconsUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(
			args.context.extensionUri,
			"node_modules",
			"@vscode/codicons",
			"dist",
			"codicon.css"
		)
	)

	return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!-- Use a content security policy to only allow loading specific resources in the webview -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${args.webview.cspSource}; style-src ${args.webview.cspSource} 'unsafe-inline'; script-src ${args.webview.cspSource} 'unsafe-inline';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Inlang Message View</title>
            <link href="${styleUri}" rel="stylesheet" />
            <link href="${codiconsUri}" rel="stylesheet" />
        </head>
        <body>
            <input type="text" id="searchInput" placeholder="Search messages...">
            ${args.highlightedContent}
            ${args.mainContent}
            <script>
                // JavaScript for collapsible sections
                document.addEventListener('DOMContentLoaded', () => {
                    // collapsible items
                    const collapsibles = document.querySelectorAll('.collapsible');
                    collapsibles.forEach(collapsible => {
                        collapsible.addEventListener('click', function() {
                            this.classList.toggle('active');
                            const content = this.nextElementSibling;
                            if (content.style.display === 'block') {
                                content.style.display = 'none';
                            } else {
                                content.style.display = 'block';
                            }
                        });
                    });
                    
                    // copy button
                    document.querySelectorAll('.copy-btn').forEach(button => {
                        button.addEventListener('click', function() {
                            const messageId = this.getAttribute('data-message-id');
                            navigator.clipboard.writeText(messageId);
                            // Show a notification or an alert
                        });
                    });

                    // search functionality
                    const searchInput = document.getElementById('searchInput');
                    searchInput.addEventListener('input', () => {
                        const searchTerm = searchInput.value.toLowerCase();
                        document.querySelectorAll('.tree-item').forEach(item => {
                            const messageId = item.querySelector('.collapsible').textContent.toLowerCase();
                            if (messageId.includes(searchTerm)) {
                                item.style.display = '';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                    });
                });
            </script>
        </body>
        </html>
    `
}

export async function messageView(args: { context: vscode.ExtensionContext }) {
	const provider = createMessageWebviewProvider({ ...args })
	args.context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("messageView", provider)
	)
}
