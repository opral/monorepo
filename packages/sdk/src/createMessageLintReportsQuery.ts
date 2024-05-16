import type {
	InlangProject,
	InstalledMessageLintRule,
	MessageLintReportsQueryApi,
	MessageQueryApi,
	MessageQueryDelegate,
} from "./api.js"
import type { ProjectSettings } from "@inlang/project-settings"
import type { resolveModules } from "./resolve-modules/index.js"
import type { MessageLintReport, Message } from "./versionedInterfaces.js"
import { lintSingleMessage } from "./lint/index.js"

import { ReactiveMap } from "./reactivity/map.js"
import { createMemo, onCleanup, untrack, batch } from "./reactivity/solid.js"
import { createSubscribable } from "./loadProject.js"

import _debug from "debug"
const debug = _debug("sdk:lintReports")

/**
 * Creates a non-reactive async query API for lint reports.
 * e.g. used in editor/.../Listheader.tsx
 *
 * TODO MESDK-50: reactivity should be restored in future
 * See https://github.com/opral/monorepo/pull/2378 for why this design.
 */
export function createMessageLintReportsQuery(
	messagesQuery: MessageQueryApi,
	settings: () => ProjectSettings,
	installedMessageLintRules: () => Array<InstalledMessageLintRule>,
	resolvedModules: () => Awaited<ReturnType<typeof resolveModules>> | undefined
): InlangProject["query"]["messageLintReports"] {
	// @ts-expect-error Reactive map seems to have a problem with Type aliases here
	const index = new ReactiveMap<MessageLintReport["messageId"], MessageLintReport[]>()

	let settledReports = Promise.resolve()

	// triggered whenever settings or resolved modules changes
	createMemo(() => {
		// we clear the index independent from the change for
		index.clear()

		onCleanup(() => {
			messagesQuery.setDelegate(undefined, false)
		})

		// settings is a signal - effect will be called whenever settings changes
		const _settings = settings()
		if (!_settings) return

		const _resolvedModules = resolvedModules()
		if (!_resolvedModules) return

		// resolvedModules is a signal - effect will be called whenever resolvedModules changes
		const rulesArray = _resolvedModules.messageLintRules

		const messageLintRuleLevels = Object.fromEntries(
			installedMessageLintRules().map((rule) => [rule.id, rule.level])
		)
		const settingsObject = () => {
			return {
				...settings(),
				messageLintRuleLevels,
			}
		}

		const sheduleLintMessage = (message: Message, messages: Message[]) => {
			settledReports = settledReports.then(() => {
				return lintSingleMessage({
					rules: rulesArray,
					settings: settingsObject(),
					messages: messages,
					message: message,
				}).then((report) => {
					const currentReports = index.get(message.id)
					debug("lintSingleMessage", message.id, report.data.length)
					// we only update the report if it differs from the known one - to not trigger reactivity
					if (report.errors.length === 0 && !reportsEqual(currentReports, report.data)) {
						// console.log("lintSingleMessage", messageId, report.data.length)
						index.set(message.id, report.data)
					}
				})
			})
		}

		// setup delegate of message query
		const messageQueryChangeDelegate: MessageQueryDelegate = {
			onCleanup: () => {
				// NOTE: we could cancel all running lint rules - but results get overritten anyway
				index.clear()
			},
			onLoaded: (messages: Message[]) => {
				// for (const message of messages) {
				// 	lintMessage(message, messages)
				// }
				batch(() => {
					for (const message of messages) {
						// NOTE: this potentually creates thousands of promisses we could create a promise that batches linting
						// NOTE: this produces a lot of signals - we could batch the
						sheduleLintMessage(message, messages)
					}
				})
			},
			onMessageCreate: (messageId: string, message: Message, messages: Message[]) => {
				// NOTE: unhandled promise rejection (as before the refactor) but won't tackle this in this pr
				// TODO MESDK-105 reevaluate all lint's instead of those for the messsage that where created
				sheduleLintMessage(message, messages)
			},
			onMessageUpdate: (messageId: string, message: Message, messages: Message[]) => {
				// NOTE: unhandled promise rejection (as before the refactor) but won't tackle this in this pr
				// TODO MESDK-105 reevaluate all lint's instead of those for the messsage that changed
				sheduleLintMessage(message, messages)
			},
			// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO MESDK-105 we gonna need the mesage Property for evaluation
			onMessageDelete: (messageId: string, _messages: Message[]) => {
				index.delete(messageId)
			},
		}

		untrack(() => {
			messagesQuery.setDelegate(messageQueryChangeDelegate, true)
		})
	})

	const get = (args: Parameters<MessageLintReportsQueryApi["get"]>[0]) => {
		debug("get", args.where.messageId)
		return structuredClone(index.get(args.where.messageId))
	}

	const getAll = () => {
		const flatValues = [...index.values()].flat()
		debug("getAll", flatValues.length)
		return structuredClone(flatValues.length === 0 ? [] : flatValues) as MessageLintReport[]
	}

	return {
		getAll: Object.assign(createSubscribable(getAll), {
			settled: async () => {
				await settledReports
				return getAll()
			},
		}),
		get: Object.assign(get, {
			subscribe: (
				args: Parameters<MessageLintReportsQueryApi["get"]["subscribe"]>[0],
				callback: Parameters<MessageLintReportsQueryApi["get"]["subscribe"]>[1]
			) => createSubscribable(() => get(args)).subscribe(callback),
		}) as any,
	}
}

function reportsEqual(
	reportsA: MessageLintReport[] | undefined,
	reportsB: MessageLintReport[] | undefined
) {
	if (reportsA === undefined && reportsB === undefined) {
		return true
	} else if (reportsA === undefined || reportsB === undefined) {
		return false
	}

	if (reportsA.length !== reportsB.length) {
		return false
	}

	for (const [i, element] of reportsA.entries()) {
		if (element?.languageTag !== reportsB[i]?.languageTag) {
			return false
		}

		if (element?.level !== reportsB[i]?.level) {
			return false
		}

		if (element?.ruleId !== reportsB[i]?.ruleId) {
			return false
		}

		if (typeof element?.body !== typeof reportsB[i]?.body) {
			return false
		}

		if (typeof element?.body === "string") {
			if (reportsB[i]?.body !== reportsB[i]?.body) {
				return false
			}
		} else {
			// NOTE: this was the fastest way to check if both bodies are equal - we can optimize that later if needed
			if (JSON.stringify(element?.body) !== JSON.stringify(element?.body)) {
				return false
			}
		}
	}
	return true
}
