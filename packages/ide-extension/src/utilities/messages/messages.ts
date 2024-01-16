import * as vscode from "vscode"
import { state } from "../../state.js"
import type { Message } from "@inlang/sdk"
import { CONFIGURATION } from "../../configuration.js"
import { getStringFromPattern } from "./query.js"

export function createMessageWebviewProvider(args: { context: vscode.ExtensionContext }) {
	let messages = state().project?.query.messages.getAll() || []
	let activeFileContent: string | undefined
	let debounceTimer: NodeJS.Timeout | undefined

	return {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			webviewView.webview.options = {
				enableScripts: true,
			}

			webviewView.webview.onDidReceiveMessage(
				(message) => {
					if (message.command === "executeCommand") {
						const commandName = message.commandName
						const commandArgs = message.commandArgs
						vscode.commands.executeCommand(commandName, commandArgs)
					}
				},
				undefined,
				args.context.subscriptions
			)

			const updateMessages = () => {
				messages = state().project?.query.messages.getAll() || []
				updateWebviewContent()
			}

			const debounceUpdate = () => {
				const activeEditor = vscode.window.activeTextEditor
				const fileContent = activeEditor ? activeEditor.document.getText() : ""
				if (debounceTimer) {
					clearTimeout(debounceTimer)
				}
				debounceTimer = setTimeout(() => {
					if (activeFileContent !== fileContent) {
						activeFileContent = fileContent
						updateWebviewContent()
					}
				}, 300)
			}

			const updateWebviewContent = () => {
				const activeEditor = vscode.window.activeTextEditor
				const fileContent = activeEditor ? activeEditor.document.getText() : ""

				const highlightedMessages = messages.filter((message) => fileContent.includes(message.id))
				const highlightedMessagesHtml =
					highlightedMessages.length > 0
						? `<div class="highlighted-section">
                        <div class="banner"><span class="active-dot"></span><span>Current file<span></div>
                        ${highlightedMessages
													.map((message) => createMessageHtml({ message, isHighlighted: true }))
													.join("")}
                    </div>`
						: ""

				const allMessagesBanner = '<div class="banner">All Messages</div>'
				const messageListHtml =
					messages.length > 0
						? `<main>${allMessagesBanner}${messages
								.map((message) => createMessageHtml({ message, isHighlighted: false }))
								.join("")}</main>`
						: `<main>${allMessagesBanner + createNoMessagesFoundHtml(true)}</main>`

				webviewView.webview.html = getHtml({
					highlightedContent: highlightedMessagesHtml,
					mainContent: messageListHtml,
					context: args.context,
					webview: webviewView.webview,
				})
			}

			updateWebviewContent() // Initial update

			args.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(debounceUpdate))
			args.context.subscriptions.push(
				vscode.workspace.onDidChangeTextDocument((event) => {
					if (
						vscode.window.activeTextEditor &&
						event.document === vscode.window.activeTextEditor.document
					) {
						debounceUpdate()
					}
				})
			)
			args.context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(updateMessages))

			// if message was extracted, update webview
			args.context.subscriptions.push(
				CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.event(() => {
					updateMessages()
				})
			)

			// if message was edited, update webview
			args.context.subscriptions.push(
				CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.event(() => {
					updateMessages()
				})
			)

			// when project view changes, update webview
			args.context.subscriptions.push(
				CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event(() => {
					updateMessages()
				})
			)
		},
	}
}

export function createMessageHtml(args: { message: Message; isHighlighted: boolean }): string {
	const translationsTableHtml = getTranslationsTableHtml(args.message)

	return `
        <div class="tree-item">
			<button class="collapsible" data-message-id="${args.message.id}">
                <span><strong>#</strong></span><span>${args.message.id}<span>
            </button>
            <div class="content" style="display: none;">
                ${translationsTableHtml}
            </div>
        </div>
    `
}

export function createNoMessagesFoundHtml(isEmpty: boolean): string {
	if (!isEmpty) {
		return ""
	}
	return `<div class="no-messages">
                <span>No messages found. Extract text to create a message by selecting a text and using the "Extract message" quick action / command.</span>
            </div>`
}

export function getTranslationsTableHtml(message: Message): string {
	const configuredLanguageTags = state().project?.settings()?.languageTags || []
	const contextTableRows = configuredLanguageTags.map((languageTag) => {
		// ... similar logic to contextTooltip for generating rows ...
		const variant = message.variants.find((v) => v.languageTag === languageTag)

		let m = CONFIGURATION.STRINGS.MISSING_TRANSLATION_MESSAGE as string

		if (variant) {
			m = getStringFromPattern({
				pattern: variant.pattern,
				languageTag: variant.languageTag,
				messageId: message.id,
			})
		}

		// Replace these commands with appropriate actions for your webview
		const editCommand = `editMessage('${message.id}', '${languageTag}')`
		const openCommand = `openInEditor('${message.id}', '${state().selectedProjectPath}')`

		return `
            <div class="section">
                <span class="languageTag"><strong>${languageTag}</strong></span>
                <span class="message"><button onclick="${editCommand}">${m}</button></span>
				<span class="actionButtons">
					<button title="Edit" onclick="${editCommand}"><span class="codicon codicon-edit"></span></button>
					<button title="Open in Fink" onclick="${openCommand}"><span class="codicon codicon-link-external"></span></button>
				</span>
            </div>
        `
	})

	return `<div class="table">${contextTableRows.join("")}</div>`
}

export function getHtml(args: {
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
            <input type="text" id="searchInput" placeholder="Search">
            ${args.highlightedContent}
            ${args.mainContent}
            <script>
				let collapsibles = [];
				let copyButtons = [];
				const vscode = acquireVsCodeApi();
			
				document.addEventListener('DOMContentLoaded', () => {
					collapsibles = document.querySelectorAll('.collapsible');
					copyButtons = document.querySelectorAll('.copy-btn');
					initializeSearchFunctionality();
					initializeCollapsibleItems();
					initializeCopyButtons();
				});
			
				function initializeCollapsibleItems() {
					collapsibles.forEach(collapsible => {
						const messageId = collapsible.getAttribute('data-message-id');
						const isHighlighted = collapsible.closest('.highlighted-section') !== null;
						const sectionPrefix = isHighlighted ? 'highlighted' : 'all';
						const storageKey = 'inlang.collapsibleState.' + sectionPrefix + '.' + messageId;
				
						const storedState = localStorage.getItem(storageKey);
						const content = collapsible.nextElementSibling;
						if (storedState) {
							const isActive = storedState === 'true';
							collapsible.classList.toggle('active', isActive);
							content.style.display = isActive ? 'block' : 'none';
						} else {
							// Ensure default state is correctly set
							content.style.display = 'none';
						}
				
						collapsible.addEventListener('click', function() {
							this.classList.toggle('active');
							const isExpanded = content.style.display === 'block';
							content.style.display = isExpanded ? 'none' : 'block';
							localStorage.setItem(storageKey, !isExpanded);
						});
					});
				}
				
				function initializeCopyButtons() {
					copyButtons.forEach(button => {
						button.addEventListener('click', function() {
							const messageId = this.getAttribute('data-message-id');
							navigator.clipboard.writeText(messageId);
						});
					});
				}

                function initializeSearchFunctionality() {
                    const searchInput = document.getElementById('searchInput');
                    const storedSearchValue = localStorage.getItem('inlang.searchValue') || '';
                    searchInput.value = storedSearchValue;

                    // Apply filter based on stored value on load
                    filterItems(storedSearchValue.toLowerCase());

                    searchInput.addEventListener('input', () => {
                        const searchTerm = searchInput.value.toLowerCase();
                        localStorage.setItem('inlang.searchValue', searchTerm);
                        filterItems(searchTerm);
                    });
                }

                function filterItems(searchTerm) {
                    document.querySelectorAll('.tree-item').forEach(item => {
                        const messageId = item.querySelector('.collapsible').textContent.toLowerCase();
                        item.style.display = messageId.includes(searchTerm) ? '' : 'none';
                    });
                }

				function editMessage(messageId, languageTag) {
					vscode.postMessage({
						command: 'executeCommand',
						commandName: 'inlang.editMessage',
						commandArgs: { messageId, languageTag },
					});
				}
			
				function openInEditor(messageId, selectedProjectPath) {
					vscode.postMessage({
						command: 'executeCommand',
						commandName: 'inlang.openInEditor',
						commandArgs: { messageId, selectedProjectPath },
					});
				}
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
	return
}
