import * as vscode from "vscode"
import { state } from "../state.js"
import type { Message } from "@inlang/sdk"
import { CONFIGURATION } from "../../configuration.js"
import { getStringFromPattern } from "./query.js"
import { escapeHtml } from "../utils.js"
import { throttle } from "throttle-debounce"

export function createMessageWebviewProvider(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
}) {
	let messages: Message[] | undefined
	let isLoading = true
	let subscribedToProjectPath = ""
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

			const updateMessages = async () => {
				// Check if project is loaded
				if (!state().project) {
					isLoading = true
					updateWebviewContent()
					return
				}

				// Subscribe to messages just once for a project
				// Assumes that subscriptions will be gc'ed when projects are switched
				// TODO: set isLoading while switching projects
				if (subscribedToProjectPath !== state().selectedProjectPath) {
					subscribedToProjectPath = state().selectedProjectPath
					state().project.query.messages.getAll.subscribe((fetchedMessages) => {
						messages = fetchedMessages ? [...fetchedMessages] : []
						isLoading = false
						throttledUpdateWebviewContent()
					})
				}
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

			const updateWebviewContent = async () => {
				const activeEditor = vscode.window.activeTextEditor
				const fileContent = activeEditor ? activeEditor.document.getText() : ""
				const ideExtensionConfig = state().project.customApi()?.["app.inlang.ideExtension"]
				const messageReferenceMatchers = ideExtensionConfig?.messageReferenceMatchers

				const matchedMessages = (
					await Promise.all(
						(messageReferenceMatchers ?? []).map(async (matcher) => {
							return matcher({ documentText: fileContent })
						})
					)
				).flat()

				const highlightedMessages = matchedMessages
					// resolve messages from id or alias
					.map((message) => {
						return (
							state().project.query.messages.get({ where: { id: message.messageId } }) ??
							state().project.query.messages.getByDefaultAlias(message.messageId)
						)
					})
					.filter((message): message is Message => message !== undefined)
				const highlightedMessagesHtml =
					highlightedMessages.length > 0
						? `<div class="highlighted-section">
                        <div class="banner"><span class="active-dot"></span><span>Current file<span></div>
                        ${highlightedMessages
													.map((message) =>
														createMessageHtml({
															message,
															position: matchedMessages.find((m) => m.messageId === message.id)
																?.position,
															isHighlighted: true,
															workspaceFolder: args.workspaceFolder,
														})
													)
													.join("")}
                    </div>`
						: ""

				const allMessagesBanner = '<div class="banner">All Messages</div>'
				let mainContentHtml = ""
				if (isLoading) {
					mainContentHtml = createMessagesLoadingHtml()
				} else if (messages && messages.length > 0) {
					mainContentHtml = `${highlightedMessagesHtml}<main>${allMessagesBanner}${messages
						.map((message) =>
							createMessageHtml({
								message,
								isHighlighted: false,
								workspaceFolder: args.workspaceFolder,
							})
						)
						.join("")}</main>`
				} else {
					mainContentHtml = `${highlightedMessagesHtml}<main>${
						allMessagesBanner + createNoMessagesFoundHtml()
					}</main>`
				}

				webviewView.webview.html = getHtml({
					mainContent: mainContentHtml,
					context: args.context,
					webview: webviewView.webview,
				})
			}
			const throttledUpdateWebviewContent = throttle(500, updateWebviewContent)

			updateMessages() // Initial update
		},
	}
}

export function createMessageHtml(args: {
	message: Message
	position?: {
		start: {
			line: number
			character: number
		}
		end: {
			line: number
			character: number
		}
	}
	isHighlighted: boolean
	workspaceFolder: vscode.WorkspaceFolder
}): string {
	// Function to check if the record has any keys
	const hasAliases = (aliases: Message["alias"]): boolean => {
		return Object.keys(aliases).length > 0
	}

	const isExperimentalAliasesEnabled = state().project.settings()?.experimental?.aliases

	const aliasHtml =
		isExperimentalAliasesEnabled && hasAliases(args.message.alias)
			? `<div class="aliases" title="Alias">
				<span><strong>@</strong></span>
				<div>
				${Object.entries(args.message.alias)
					.map(
						([key, value]) =>
							`<span data-alias="${escapeHtml(value)}"><i>${escapeHtml(key)}</i>: ${escapeHtml(
								value
							)}</span>`
					)
					.join("")}
				</div>
			</div>`
			: ""

	const translationsTableHtml = getTranslationsTableHtml({
		message: args.message,
		workspaceFolder: args.workspaceFolder,
	})

	// Fink needs the relative path from the workspace/git root
	const relativeProjectPathFromWorkspace = state().selectedProjectPath.replace(
		args.workspaceFolder.uri.fsPath,
		""
	)

	const positionHtml = encodeURIComponent(JSON.stringify(args.position))
	const jumpCommand = `jumpToPosition('${args.message.id}', '${positionHtml}');event.stopPropagation();`
	const openCommand = `openInEditor('${args.message.id}', '${relativeProjectPathFromWorkspace}');event.stopPropagation();`

	return `
	<div class="tree-item">
		<div class="collapsible" data-message-id="${args.message.id}">
			<div class="messageId">
				<span><strong>#</strong></span>
				<span>${args.message.id}</span>
			</div>
			<div class="actionButtons">
				${
					args.position
						? `<span title="Jump to message" onclick="${jumpCommand}"><span class="codicon codicon-magnet"></span></span>`
						: ""
				}
				<span title="Open in Fink" onclick="${openCommand}"><span class="codicon codicon-link-external"></span></span>
			</div>
		</div>
		<div class="content" style="display: none;">
			${translationsTableHtml}
			${aliasHtml}
		</div>
	</div>
    `
}

export function createNoMessagesFoundHtml(): string {
	return `<div class="no-messages">
                <span>No messages found. Extract text to create a message by selecting a text and using the "Extract message" quick action / command.</span>
            </div>`
}

export function createMessagesLoadingHtml(): string {
	return `<div class="loading">
				<span>Loading messages...</span>
			</div>`
}

export function getTranslationsTableHtml(args: {
	message: Message
	workspaceFolder: vscode.WorkspaceFolder
}): string {
	const configuredLanguageTags = state().project.settings()?.languageTags || []
	const contextTableRows = configuredLanguageTags.map((languageTag) => {
		const variant = args.message.variants.find((v) => v.languageTag === languageTag)

		let m = CONFIGURATION.STRINGS.MISSING_TRANSLATION_MESSAGE as string

		if (variant) {
			m = getStringFromPattern({
				pattern: variant.pattern,
				languageTag: variant.languageTag,
				messageId: args.message.id,
			})
		}

		const editCommand = `editMessage('${args.message.id}', '${escapeHtml(languageTag)}')`
		const machineTranslateCommand = `machineTranslate('${args.message.id}', '${
			state().project.settings()?.sourceLanguageTag
		}', ['${languageTag}'])`

		return `
            <div class="section">
                <span class="languageTag"><strong>${escapeHtml(languageTag)}</strong></span>
                <span class="message"><button onclick="${editCommand}">${escapeHtml(
			m
		)}</button></span>
				<span class="actionButtons">
				${
					m === CONFIGURATION.STRINGS.MISSING_TRANSLATION_MESSAGE
						? `
				<button title="Machine translate" onclick="${machineTranslateCommand}">
				<svg slot="prefix" height="16px" width="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="m15.075 18.95l-.85 2.425q-.1.275-.35.45t-.55.175q-.5 0-.812-.413t-.113-.912l3.8-10.05q.125-.275.375-.45t.55-.175h.75q.3 0 .55.175t.375.45L22.6 20.7q.2.475-.1.888t-.8.412q-.325 0-.562-.175t-.363-.475l-.85-2.4zM9.05 13.975L4.7 18.3q-.275.275-.687.288T3.3 18.3q-.275-.275-.275-.7t.275-.7l4.35-4.35q-.875-.875-1.588-2T4.75 8h2.1q.5.975 1 1.7t1.2 1.45q.825-.825 1.713-2.313T12.1 6H2q-.425 0-.712-.288T1 5q0-.425.288-.712T2 4h6V3q0-.425.288-.712T9 2q.425 0 .713.288T10 3v1h6q.425 0 .713.288T17 5q0 .425-.288.713T16 6h-1.9q-.525 1.8-1.575 3.7t-2.075 2.9l2.4 2.45l-.75 2.05zM15.7 17.2h3.6l-1.8-5.1z" fill="currentColor"/>
				</svg>
				</button>`
						: `<button title="Edit" onclick="${editCommand}"><span class="codicon codicon-edit"></span></button>`
				}
				</span>
            </div>
        `
	})

	return `<div class="table">${contextTableRows.join("")}</div>`
}

export function getHtml(args: {
	mainContent: string
	context: vscode.ExtensionContext
	webview: vscode.Webview
}): string {
	const styleUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "styles.css")
	)
	const codiconsUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "codicon.css")
	)
	const codiconsTtfUri = args.webview.asWebviewUri(
		vscode.Uri.joinPath(args.context.extensionUri, "assets", "codicon.ttf")
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
			<link href="${codiconsTtfUri}" rel="stylesheet" />
        </head>
        <body>
            <input type="text" id="searchInput" placeholder="Search">
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
						const storageKey = 'sherlock.collapsibleState.' + sectionPrefix + '.' + messageId;
				
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
							collapsible.classList.toggle('active');
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
                    const storedSearchValue = localStorage.getItem('sherlock.searchValue') || '';
                    searchInput.value = storedSearchValue;

                    // Apply filter based on stored value on load
                    filterItems(storedSearchValue.toLowerCase());

                    searchInput.addEventListener('input', () => {
                        const searchTerm = searchInput.value.toLowerCase();
                        localStorage.setItem('sherlock.searchValue', searchTerm);
                        filterItems(searchTerm);
                    });
                }

				function filterItems(searchTerm) {
					document.querySelectorAll('.tree-item').forEach(item => {
						const messageId = item.querySelector('.collapsible').textContent.toLowerCase();
						const messageButtons = item.querySelectorAll('.message button');
						let translationsText = '';
						messageButtons.forEach(button => {
							translationsText += button.textContent.toLowerCase() + ' ';
						});

						// Use the data-alias attribute for search
						const aliases = item.querySelectorAll('.aliases [data-alias]');
						let aliasesText = '';
						aliases.forEach(alias => {
							aliasesText += alias.getAttribute('data-alias').toLowerCase() + ' ';
						});
				
						const itemVisible = messageId.includes(searchTerm) || translationsText.includes(searchTerm) || aliasesText.includes(searchTerm);
						item.style.display = itemVisible ? '' : 'none';
					});
				}

				function editMessage(messageId, languageTag) {
					vscode.postMessage({
						command: 'executeCommand',
						commandName: 'sherlock.editMessage',
						commandArgs: { messageId, languageTag },
					});
				}
			
				function openInEditor(messageId, selectedProjectPath) {
					vscode.postMessage({
						command: 'executeCommand',
						commandName: 'sherlock.openInEditor',
						commandArgs: { messageId, selectedProjectPath },
					});
				}

				function jumpToPosition(messageId, position) {
					const decodedPosition = JSON.parse(decodeURIComponent(position));
					vscode.postMessage({
						command: 'executeCommand',
						commandName: 'sherlock.jumpToPosition',
						commandArgs: { messageId, position: decodedPosition },
					});
				}

				function machineTranslate(messageId, sourceLanguageTag, targetLanguageTags) {
					vscode.postMessage({
						command: 'executeCommand',
						commandName: 'sherlock.machineTranslateMessage',
						commandArgs: { messageId, sourceLanguageTag, targetLanguageTags },
					});
				}
            </script>
        </body>
        </html>
    `
}

export async function messageView(args: {
	context: vscode.ExtensionContext
	workspaceFolder: vscode.WorkspaceFolder
}) {
	const provider = createMessageWebviewProvider({ ...args })

	args.context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("messageView", provider)
	)
}
