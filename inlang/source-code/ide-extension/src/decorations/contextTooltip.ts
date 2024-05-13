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
	openInFinkCommand?: Uri
	machineTranslateCommand?: Uri
}

function renderTranslationRow(row: ContextTableRow) {
	const openInFinkLink = row.openInFinkCommand
		? `<a href="${row.openInFinkCommand}">$(link-external)</a>`
		: ""

	// Decide between machine translate and edit command based on the message
	let actionCommandLink
	if (row.message === MISSING_TRANSLATION_MESSAGE) {
		actionCommandLink = row.machineTranslateCommand
			? `<a href="${row.machineTranslateCommand}" title="Translate message with Inlang AI">$(sparkle)</a>`
			: ""
	} else {
		actionCommandLink = row.editCommand ? `<a href="${row.editCommand}">$(edit)</a>` : ""
	}

	const messageListing = `<td><strong>${escapeHtml(
		row.language
	)}&nbsp;</strong></td><td>${escapeHtml(row.message)}</td>`
	const actionCommandCell = actionCommandLink ? `<td>&nbsp;&nbsp;${actionCommandLink}</td>` : ""
	const openInFinkCell = openInFinkLink ? `<td>&nbsp;${openInFinkLink}</td>` : ""

	return `<tr>${messageListing}${actionCommandCell}${openInFinkCell}</tr>`
}

export function contextTooltip(
	referenceMessage: Awaited<
		ReturnType<CustomApiInlangIdeExtension["messageReferenceMatchers"][number]>
	>[number]
) {
	// resolve message from id or alias
	const message =
		state().project.query.messages.get({
			where: { id: referenceMessage.messageId },
		}) ?? state().project.query.messages.getByDefaultAlias(referenceMessage.messageId)

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
		const machineTranslateCommand = Uri.parse(
			INTERPOLATE.COMMAND_URI(
				"MACHINE_TRANSLATE_MESSAGE",
				JSON.stringify({
					messageId: referenceMessage.messageId,
					sourceLanguageTag: state().project.settings()?.sourceLanguageTag,
					targetLanguageTags: [languageTag],
				})
			)
		)
		const openInFinkCommand = Uri.parse(INTERPOLATE.COMMAND_URI("OPEN_IN_FINK", args))

		return {
			language: languageTag,
			message: m,
			editCommand,
			openInFinkCommand,
			machineTranslateCommand,
		}
	})

	const contextTable = `<table>${contextTableRows.map(renderTranslationRow).join("")}</table>`
	const tooltip = new MarkdownString(contextTable, true)

	tooltip.supportHtml = true
	tooltip.isTrusted = true
	tooltip.supportThemeIcons = true

	return tooltip
}
