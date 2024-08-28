import { MarkdownString, Uri } from "vscode"
import { state } from "../utilities/state.js"
import { getStringFromPattern } from "../utilities/messages/query.js"
import { INTERPOLATE } from "../configuration.js"
import { escapeHtml } from "../utilities/utils.js"
import { selectBundleNested, type IdeExtensionConfig } from "@inlang/sdk2"

const MISSING_TRANSLATION_MESSAGE = "[missing]"

type ContextTableRow = {
	locale: string
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

	const messageListing = `<td><strong>${escapeHtml(row.locale)}&nbsp;</strong></td><td>${escapeHtml(
		row.message
	)}</td>`
	const actionCommandCell = actionCommandLink ? `<td>&nbsp;&nbsp;${actionCommandLink}</td>` : ""
	const openInFinkCell = openInFinkLink ? `<td>&nbsp;${openInFinkLink}</td>` : ""

	return `<tr>${messageListing}${actionCommandCell}${openInFinkCell}</tr>`
}

export async function contextTooltip(
	referenceMessage: Awaited<
		ReturnType<IdeExtensionConfig["messageReferenceMatchers"][number]>
	>[number]
) {
	// resolve message from id or alias
	const bundle = await selectBundleNested(state().project.db)
		.where((eb) =>
			eb.or([
				eb("id", "=", referenceMessage.bundleId),
				eb(eb.ref("alias", "->").key("default"), "=", referenceMessage.bundleId),
			])
		)
		.executeTakeFirst()

	if (!bundle) {
		return undefined // Return early if message is not found
	}

	// Get the configured language tags
	const configuredLanguageTags = state().project.settings.get()?.locales || []

	// Generate rows for each configured language tag
	const contextTableRows: ContextTableRow[] = configuredLanguageTags.map((locale) => {
		const message = bundle.messages.find((m) => m.locale === locale)

		// Get the variant from the message
		const variant = message?.variants.find((v) => v.match.locale === locale)

		let m = MISSING_TRANSLATION_MESSAGE

		if (message && variant) {
			m = getStringFromPattern({
				pattern: variant.pattern,
				locale: message.locale,
				messageId: message.id,
			})
		}

		const args = encodeURIComponent(
			JSON.stringify([{ bundleId: referenceMessage.bundleId, languageTag: locale }])
		)

		const editCommand = Uri.parse(INTERPOLATE.COMMAND_URI("EDIT_MESSAGE", args))
		const machineTranslateCommand = Uri.parse(
			INTERPOLATE.COMMAND_URI(
				"MACHINE_TRANSLATE_MESSAGE",
				JSON.stringify({
					bundleId: referenceMessage.bundleId,
					baseLocale: state().project.settings.get()?.baseLocale,
					targetLocales: [locale],
				})
			)
		)
		const openInFinkCommand = Uri.parse(INTERPOLATE.COMMAND_URI("OPEN_IN_FINK", args))

		return {
			locale,
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
