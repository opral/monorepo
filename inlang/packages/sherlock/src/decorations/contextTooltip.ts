import * as vscode from "vscode"
import { MarkdownString, Uri } from "vscode"
import { safeState } from "../utilities/state.js"
import { getStringFromPattern } from "../utilities/messages/query.js"
import { INTERPOLATE } from "../configuration.js"
import { escapeHtml } from "../utilities/utils.js"
import { type IdeExtensionConfig } from "@inlang/sdk"
import { getSelectedBundleByBundleIdOrAlias } from "../utilities/helper.js"
import { logger } from "../utilities/logger.js"

const MISSING_TRANSLATION_MESSAGE = "[missing]"

type ContextTableRow = {
	locale: string
	message: string
	bundleId: string
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
	const context = vscode.extensions.getExtension("inlang.vs-code-extension")?.exports.context
	if (!context) {
		logger.error("Extension context is not available for context tooltip")
		return
	}

	// @ts-ignore TODO: Introduce deprecation message for messageId
	referenceMessage.bundleId = referenceMessage.bundleId || referenceMessage.messageId
	// resolve message from id or alias
	const bundle = await getSelectedBundleByBundleIdOrAlias(referenceMessage.bundleId)

	if (!bundle) {
		return undefined // Return early if message is not found
	}

	// Get the configured language tags
	const activeProject = safeState()?.project
	if (!activeProject) {
		logger.warn("Context tooltip requested without an active project")
		return undefined
	}

	const configuredLanguageTags = (await activeProject.settings.get())?.locales || []

	// Generate rows for each configured language tag
	const contextTableRows: ContextTableRow[] = await Promise.all(
		configuredLanguageTags.map(async (locale) => {
			const message = bundle.messages.find((m) => m.locale === locale)

			// Get the catchall variant or first variant as fallback
			const variant =
				message?.variants.find((v) => v.matches.some((m) => m.type === "catchall-match")) ||
				message?.variants[0]

			let m = MISSING_TRANSLATION_MESSAGE

			if (message && variant) {
				m = getStringFromPattern({
					pattern: variant.pattern,
					locale: message.locale,
					messageId: message.id,
				})
			}

			const editCommand = Uri.parse(
				INTERPOLATE.COMMAND_URI(
					"OPEN_EDITOR_VIEW",
					encodeURIComponent(JSON.stringify({ bundleId: referenceMessage.bundleId }))
				)
			)
			const machineTranslateCommand = Uri.parse(
				INTERPOLATE.COMMAND_URI(
					"MACHINE_TRANSLATE_MESSAGE",
					JSON.stringify({
						bundleId: referenceMessage.bundleId,
						baseLocale: (await activeProject.settings.get())?.baseLocale,
						targetLocales: [locale],
					})
				)
			)
			// const openInFinkCommand = Uri.parse(
			// 	INTERPOLATE.COMMAND_URI(
			// 		"OPEN_IN_FINK",
			// 		encodeURIComponent(JSON.stringify([{ bundleId: referenceMessage.bundleId, context }]))
			// 	)
			// )

			return {
				locale,
				message: m,
				bundleId: referenceMessage.bundleId,
				editCommand,
				// openInFinkCommand,
				machineTranslateCommand,
			}
		})
	)

	const contextTable = `<table>${contextTableRows.map(renderTranslationRow).join("")}</table>`
	const tooltip = new MarkdownString(contextTable, true)

	tooltip.supportHtml = true
	tooltip.isTrusted = true
	tooltip.supportThemeIcons = true

	return tooltip
}
