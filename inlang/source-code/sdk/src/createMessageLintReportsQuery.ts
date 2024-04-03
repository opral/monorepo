import type {
	InlangProject,
	InstalledMessageLintRule,
	MessageLintReportsQueryApi,
	MessageQueryApi,
} from "./api.js"
import type { ProjectSettings } from "@inlang/project-settings"
import type { resolveModules } from "./resolve-modules/index.js"
import type { MessageLintReport, Message } from "./versionedInterfaces.js"
import { lintSingleMessage } from "./lint/index.js"
import { createRoot, createEffect } from "./reactivity/solid.js"

import { throttle } from "throttle-debounce"
import _debug from "debug"
const debug = _debug("sdk:lintReports")

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Creates a reactive query API for messages.
 */
export function createMessageLintReportsQuery(
	messagesQuery: MessageQueryApi,
	settings: () => ProjectSettings,
	installedMessageLintRules: () => Array<InstalledMessageLintRule>,
	resolvedModules: () => Awaited<ReturnType<typeof resolveModules>> | undefined
): InlangProject["query"]["messageLintReports"] {
	const index = new Map<MessageLintReport["messageId"], MessageLintReport[]>()

	const modules = resolvedModules()

	const rulesArray = modules?.messageLintRules
	const messageLintRuleLevels = Object.fromEntries(
		installedMessageLintRules().map((rule) => [rule.id, rule.level])
	)
	const settingsObject = () => {
		return {
			...settings(),
			messageLintRuleLevels,
		}
	}

	const messages = messagesQuery.getAll() as Message[]

	const trackedMessages: Map<string, () => void> = new Map()

	debug(`createMessageLintReportsQuery ${rulesArray?.length} rules, ${messages.length} messages`)

	// TODO: don't throttle when no debug
	let lintMessageCount = 0
	const throttledLogLintMessage = throttle(2000, (messageId) => {
		debug(`lintSingleMessage: ${lintMessageCount} id: ${messageId}`)
	})

	createEffect(() => {
		const currentMessageIds = new Set(messagesQuery.includedMessageIds())

		const deletedTrackedMessages = [...trackedMessages].filter(
			(tracked) => !currentMessageIds.has(tracked[0])
		)

		if (rulesArray) {
			for (const messageId of currentMessageIds) {
				if (!trackedMessages.has(messageId)) {
					createRoot((dispose) => {
						createEffect(() => {
							const message = messagesQuery.get({ where: { id: messageId } })
							if (!message) {
								return
							}
							if (!trackedMessages?.has(messageId)) {
								// initial effect execution - add dispose function
								trackedMessages?.set(messageId, dispose)
							}

							lintSingleMessage({
								rules: rulesArray,
								settings: settingsObject(),
								messages: messages,
								message: message,
							}).then((report) => {
								lintMessageCount++
								throttledLogLintMessage(messageId)
								if (report.errors.length === 0 && index.get(messageId) !== report.data) {
									// console.log("lintSingleMessage", messageId, report.data.length)
									index.set(messageId, report.data)
								}
							})
						})
					})
				}
			}

			for (const deletedMessage of deletedTrackedMessages) {
				const deletedMessageId = deletedMessage[0]

				// call dispose to cleanup the effect
				const messageEffectDisposeFunction = trackedMessages.get(deletedMessageId)
				if (messageEffectDisposeFunction) {
					messageEffectDisposeFunction()
					trackedMessages.delete(deletedMessageId)
					// remove lint report result
					index.delete(deletedMessageId)
					debug(`delete lint message id: ${deletedMessageId}`)
				}
			}
		}
	})

	return {
		getAll: async () => {
			await sleep(0) // evaluate on next tick to allow for out-of-order effects
			return structuredClone(
				[...index.values()].flat().length === 0 ? [] : [...index.values()].flat()
			)
		},
		get: async (args: Parameters<MessageLintReportsQueryApi["get"]>[0]) => {
			await sleep(0) // evaluate on next tick to allow for out-of-order effects
			return structuredClone(index.get(args.where.messageId) ?? [])
		},
	}
}
