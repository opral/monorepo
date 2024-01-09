import * as vscode from "vscode"
import { state } from "../../state.js"
import type { Message } from "@inlang/sdk"

export function createMessageWebviewProvider() {
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
                <span class="codicon codicon-note"></span> ${args.message.id}
            </button>
            <div class="content" style="display: none;">
                <p>Source language tag: ${"en"}</p>
                <button class="copy-btn" data-message-id="${args.message.id}">Copy ID</button>
            </div>
        </div>
    `
}

function getHtml(args: { highlightedContent: string; mainContent: string }): string {
	return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://raw.githubusercontent.com/microsoft/vscode-codicons/main/dist/codicon.css">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe WUI", "Ubuntu", sans-serif;
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .collapsible {
                    background-color: inherit;
                    color: var(--vscode-editor-foreground);
                    cursor: pointer;
                    padding: 10px;
                    border: none;
                    text-align: left;
                    outline: none;
                    width: 100%;
                }

                .content {
                    padding: 0 18px;
                    display: none;
                }

                .highlighted-section {
                    background-color: rgba(147, 112, 219, 0.5);
                    border-radius: 4px;
                    margin-bottom: 20px;
                }

                #searchInput {
                    width: calc(100% - 20px);
                    margin: 10px;
                    box-sizing: border-box;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
            </style>
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
	const provider = createMessageWebviewProvider()
	args.context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("messageView", provider)
	)
}
