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
			? `<a href="${row.machineTranslateCommand}">
				<svg slot="prefix" height="16px" width="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="m15.075 18.95l-.85 2.425q-.1.275-.35.45t-.55.175q-.5 0-.812-.413t-.113-.912l3.8-10.05q.125-.275.375-.45t.55-.175h.75q.3 0 .55.175t.375.45L22.6 20.7q.2.475-.1.888t-.8.412q-.325 0-.562-.175t-.363-.475l-.85-2.4zM9.05 13.975L4.7 18.3q-.275.275-.687.288T3.3 18.3q-.275-.275-.275-.7t.275-.7l4.35-4.35q-.875-.875-1.588-2T4.75 8h2.1q.5.975 1 1.7t1.2 1.45q.825-.825 1.713-2.313T12.1 6H2q-.425 0-.712-.288T1 5q0-.425.288-.712T2 4h6V3q0-.425.288-.712T9 2q.425 0 .713.288T10 3v1h6q.425 0 .713.288T17 5q0 .425-.288.713T16 6h-1.9q-.525 1.8-1.575 3.7t-2.075 2.9l2.4 2.45l-.75 2.05zM15.7 17.2h3.6l-1.8-5.1z" fill="currentColor"/>
				</svg>
			</a>`
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
			INTERPOLATE.COMMAND_URI("MACHINE_TRANSLATE_MESSAGE", args)
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
	const tooltip = new MarkdownString(contextTable)

	tooltip.supportHtml = true
	tooltip.isTrusted = true
	tooltip.supportThemeIcons = true

	return tooltip
}
