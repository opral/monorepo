import * as vscode from "vscode"
import { debounce } from "throttle-debounce"
import { query } from "@inlang/core/query"
import { state } from "../state.js"
import { telemetryNode } from "@inlang/telemetry"

const MAXIMUM_PREVIEW_LENGTH = 40

export async function messagePreview(args: {
	activeTextEditor: vscode.TextEditor
	context: vscode.ExtensionContext
}) {
	const { context } = args
	let activeTextEditor = vscode.window.activeTextEditor

	const messagePreview = vscode.window.createTextEditorDecorationType({
		after: {
			margin: "0 0.5rem",
		},
	})

	updateDecorations()

	async function updateDecorations() {
		if (!activeTextEditor) {
			return
		}

		// TODO: this is a hack to prevent the message preview from showing up in the inlang.config.js file
		if (args.activeTextEditor.document.fileName.includes("inlang.config.js")) {
			return activeTextEditor.setDecorations(messagePreview, [])
		}

		// Get the reference language
		const { referenceLanguage } = state().config
		const messageReferenceMatchers = state().config.ideExtension?.messageReferenceMatchers
		if (referenceLanguage === undefined) {
			return vscode.window.showWarningMessage(
				"The `referenceLanguage` must be defined in the inlang.config.js to show patterns inline.",
			)
		}
		if (messageReferenceMatchers === undefined) {
			return vscode.window.showWarningMessage(
				"The `messageReferenceMatchers` must be defined in the inlang.config.js to show patterns inline.",
			)
		}

		const ref = state().resources.find(
			(resource) => resource.languageTag.name === referenceLanguage,
		)
		if (!ref) {
			return vscode.window.showWarningMessage(
				`The reference language '${referenceLanguage}' is not defined in the inlang.config.js.`,
			)
		}

		// Get the message references
		const wrappedDecorations = (state().config.ideExtension?.messageReferenceMatchers ?? []).map(
			async (matcher) => {
				const messages = await matcher({
					documentText: args.activeTextEditor.document.getText(),
				})
				return messages.map((message) => {
					const translation = query(ref).get({
						id: message.messageId,
					})?.pattern.elements

					const translationText =
						translation && translation.length > 0 ? (translation[0]!.value as string) : undefined

					const truncatedTranslationText =
						translationText &&
						(translationText.length > (MAXIMUM_PREVIEW_LENGTH || 0)
							? `${translationText.slice(0, MAXIMUM_PREVIEW_LENGTH)}...`
							: translationText)
					const range = new vscode.Range(
						// VSCode starts to count lines and columns from zero
						new vscode.Position(
							message.position.start.line - 1,
							message.position.start.character - 1,
						),
						new vscode.Position(message.position.end.line - 1, message.position.end.character - 1),
					)
					const decoration: vscode.DecorationOptions = {
						range,
						renderOptions: {
							after: {
								contentText:
									truncatedTranslationText ??
									`ERROR: '${message.messageId}' not found in reference language '${referenceLanguage}'`,
								backgroundColor: translationText ? "rgb(45 212 191/.15)" : "drgb(244 63 94/.15)",
								border: translationText
									? "1px solid rgb(45 212 191/.50)"
									: "1px solid rgb(244 63 94/.50)",
							},
						},
						hoverMessage: translationText,
					}
					return decoration
				})
			},
		)
		const decorations = (await Promise.all(wrappedDecorations || [])).flat()
		activeTextEditor.setDecorations(messagePreview, decorations)
	}

	const debouncedUpdateDecorations = debounce(500, updateDecorations)

	vscode.window.onDidChangeActiveTextEditor(
		(editor) => {
			if (editor) {
				activeTextEditor = editor
				debouncedUpdateDecorations()
			}
		},
		undefined,
		context.subscriptions,
	)

	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (activeTextEditor && event.document === activeTextEditor.document) {
				updateDecorations()
			}
		},
		undefined,
		context.subscriptions,
	)
}
