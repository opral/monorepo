import type { CustomApiInlangIdeExtension, LanguageTag } from "@inlang/sdk"
import { MarkdownString, Uri } from "vscode"
import { state } from "../utilities/state.js"
import { getStringFromPattern } from "../utilities/messages/query.js"
import { INTERPOLATE } from "../configuration.js"
import { escapeHtml } from "../utilities/utils.js"

const MISSING_TRANSLATION_MESSAGE = "[missing]"

type ContextTableRow = {
	language: LanguageTag
	message: string
	editCommand?: Uri
	openInEditorCommand?: Uri
}

function renderTranslationRow(row: ContextTableRow) {
	const editCommandLink = row.editCommand ? `<a href="${row.editCommand}">$(edit)</a>` : ""
	const openInEditorLink = row.openInEditorCommand
		? `<a href="${row.openInEditorCommand}">$(link-external)</a>`
		: ""
	const messageListing = `<td><strong>${escapeHtml(
		row.language
	)}&nbsp;</strong></td><td>${escapeHtml(row.message)}</td>`
	const editCommandCell = editCommandLink ? `<td>&nbsp;&nbsp;${editCommandLink}</td>` : ""
	const openInEditorCell = openInEditorLink ? `<td>&nbsp;${openInEditorLink}</td>` : ""
	return `<tr>${messageListing}${editCommandCell}${openInEditorCell}</tr>`
}

export function contextTooltip(
	referenceMessage: Awaited<
		ReturnType<CustomApiInlangIdeExtension["messageReferenceMatchers"][number]>
	>[number]
) {
	const message = state().project.query.messages.get({
		where: { id: referenceMessage.messageId },
	})

	if (!message) {
		return undefined // Return early if message is not found
	}

	// Get the configured language tags
	const configuredLanguageTags = state().project.settings()?.languageTags || []

	// Generate rows for each configured language tag
	const contextTableRows: ContextTableRow[] = configuredLanguageTags.map((languageTag) => {
		const variant = message.variants.find((v) => v.languageTag === languageTag)

		let m = MISSING_TRANSLATION_MESSAGE

		if (variant) {
			m = getStringFromPattern({
				pattern: variant.pattern,
				languageTag: variant.languageTag,
				messageId: message.id,
			})
		}

		const args = encodeURIComponent(
			JSON.stringify([{ messageId: referenceMessage.messageId, languageTag: languageTag }])
		)

		const editCommand = Uri.parse(INTERPOLATE.COMMAND_URI("EDIT_MESSAGE", args))
		const openInEditorCommand = Uri.parse(INTERPOLATE.COMMAND_URI("OPEN_IN_EDITOR", args))

		return {
			language: languageTag,
			message: m,
			editCommand,
			openInEditorCommand,
		}
	})

	const contextTable = `<table>${contextTableRows.map(renderTranslationRow).join("")}</table>`
	const tooltip = new MarkdownString(contextTable)

	tooltip.supportHtml = true
	tooltip.isTrusted = true
	tooltip.supportThemeIcons = true

	return tooltip
}
