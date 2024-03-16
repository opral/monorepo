import { createSubscribable } from "./loadProject.js"
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
import { ReactiveMap } from "./reactivity/map.js"
import { createRoot, createEffect } from "./reactivity/solid.js"

/**
 * Creates a reactive query API for messages.
 */
export function createMessageLintReportsQuery(
	messagesQuery: MessageQueryApi,
	settings: () => ProjectSettings,
	installedMessageLintRules: () => Array<InstalledMessageLintRule>,
	resolvedModules: () => Awaited<ReturnType<typeof resolveModules>> | undefined
): InlangProject["query"]["messageLintReports"] {
	// @ts-expect-error
	const index = new ReactiveMap<MessageLintReport["messageId"], MessageLintReport[]>()

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
								if (report.errors.length === 0 && index.get(messageId) !== report.data) {
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
				}
			}
		}
	})

	const get = (args: Parameters<MessageLintReportsQueryApi["get"]>[0]) => {
		return structuredClone(index.get(args.where.messageId))
	}

	return {
		getAll: createSubscribable(() => {
			return structuredClone(
				[...index.values()].flat().length === 0 ? [] : [...index.values()].flat()
			)
		}),
		get: Object.assign(get, {
			subscribe: (
				args: Parameters<MessageLintReportsQueryApi["get"]["subscribe"]>[0],
				callback: Parameters<MessageLintReportsQueryApi["get"]["subscribe"]>[1]
			) => createSubscribable(() => get(args)).subscribe(callback),
		}) as any,
	}
}
