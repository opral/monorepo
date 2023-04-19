import * as vscode from "vscode"
import { debounce } from "throttle-debounce"
import { query } from "@inlang/core/query"
import { state } from "../state.js"

const MAXIMUM_PREVIEW_LENGTH = 40

export async function messagePreview(args: {
	activeTextEditor: vscode.TextEditor
	context: vscode.ExtensionContext
}) {
	const { context } = args
	const { referenceLanguage } = state().config
	const referenceResource = state().resources.find(
		(resource) => resource.languageTag.name === referenceLanguage,
	)
	let activeTextEditor = vscode.window.activeTextEditor

	const messagePreview = vscode.window.createTextEditorDecorationType({
		after: {
			margin: "0 0.5rem",
		},
	})

	if (referenceLanguage === undefined) {
		return vscode.window.showWarningMessage(
			"The `referenceLanguage` must be defined in the inlang.config.js to show patterns inline.",
		)
	}

	updateDecorations()

	async function updateDecorations() {
		if (!activeTextEditor || !referenceResource) {
			return
		}

		const wrappedDecorations = state().config.ideExtension?.messageReferenceMatchers.map(
			async (matcher) => {
				const messages = await matcher({
					documentText: args.activeTextEditor.document.getText(),
				})
				return messages.map((message) => {
					const translation = query(referenceResource).get({
						id: message.messageId,
					})?.pattern.elements[0]
					if (translation?.type !== "Text") {
						throw new Error("Only Text elements are supported for message previews.")
					}
					const previewText = translation.value
					const truncatedPreviewText =
						translation.value.length > MAXIMUM_PREVIEW_LENGTH
							? `${previewText.slice(0, MAXIMUM_PREVIEW_LENGTH)}...`
							: previewText
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
								contentText: truncatedPreviewText ?? `ERROR: '${message.messageId}' not found`,
								backgroundColor: previewText ? "rgb(45 212 191/.15)" : "rgb(244 63 94/.15)",
								border: previewText
									? "1px solid rgb(45 212 191/.50)"
									: "1px solid rgb(244 63 94/.50)",
							},
						},
						hoverMessage: previewText,
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
