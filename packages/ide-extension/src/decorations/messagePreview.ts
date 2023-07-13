import * as vscode from "vscode"
import { query } from "@inlang/core/query"
import { state } from "../state.js"
import { contextTooltip } from './contextTooltip.js'
import { onDidEditMessage } from '../commands/editMessage.js'

const MAXIMUM_PREVIEW_LENGTH = 40

export async function messagePreview(args: { context: vscode.ExtensionContext }) {
	const messagePreview = vscode.window.createTextEditorDecorationType({
		after: {
			margin: "0 0.5rem",
		},
	})

	async function updateDecorations() {
		const activeTextEditor = vscode.window.activeTextEditor

		if (!activeTextEditor) {
			return
		}

		// TODO: this is a hack to prevent the message preview from showing up in the inlang.config.js file
		if (activeTextEditor.document.fileName.includes("inlang.config.js")) {
			return activeTextEditor.setDecorations(messagePreview, [])
		}

		// Get the reference language
		const { referenceLanguage } = state().config
		const messageReferenceMatchers = state().config.ideExtension?.messageReferenceMatchers

		const refResource = state().resources.find(
			(resource) => resource.languageTag.name === referenceLanguage,
		)

		if (
			referenceLanguage === undefined ||
			messageReferenceMatchers === undefined ||
			refResource === undefined
		) {
			// don't show an error message. See issue:
			// https://github.com/inlang/inlang/issues/927
			return
		}

		// Get the message references
		const wrappedDecorations = (state().config.ideExtension?.messageReferenceMatchers ?? []).map(
			async (matcher) => {
				const messages = await matcher({
					documentText: activeTextEditor.document.getText(),
				})
				return messages.map((message) => {
					const translation = query(refResource).get({
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
						hoverMessage: contextTooltip(message),
					}
					return decoration
				})
			},
		)
		const decorations = (await Promise.all(wrappedDecorations || [])).flat()
		activeTextEditor.setDecorations(messagePreview, decorations)
	}

	// in case the active text editor is already open, update decorations
	updateDecorations()

	// immediately update decorations when the active text editor changes
	vscode.window.onDidChangeActiveTextEditor(
		() => updateDecorations(),
		undefined,
		args.context.subscriptions,
	)

	// update decorations when the text changes in a document
	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				updateDecorations()
			}
		},
		undefined,
		args.context.subscriptions,
	)

	// update decorations, when message was edited
	onDidEditMessage(() => updateDecorations());
}
