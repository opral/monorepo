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
import { createEffect, createMemo, onCleanup, untrack } from "./reactivity/solid.js"
import { createSubscribable } from "./loadProject.js"

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Creates a ~~reactive~~ query API for lint reports.
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

	// triggered whenever settings or resolved modules change
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
					if (report.errors.length === 0 && index.get(message.id) !== report.data) {
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
				for (const message of messages) {
					// NOTE: this potentually creates thousands of promisses we could create a promise that batches linting
					// NOTE: this produces a lot of signals - we could batch the
					sheduleLintMessage(message, messages)
				}
			},
			onMessageCreate: (messageId: string, message: Message) => {
				// TODO unhandled promise rejection (as before the refactor) but won't tackle this in this pr
				// FIX allMessages here - this should be passed into the delegate!
				sheduleLintMessage(message, [])
			},
			onMessageUpdate: (messageId: string, message: Message) => {
				// TODO unhandled promise rejection (as before the refactor) but won't tackle this in this pr
				// FIX allMessages here - this should be passed into the delegate!
				sheduleLintMessage(message, [])
			},
			onMessageDelete: (messageId: string) => {
				index.delete(messageId)
			},
		}

		untrack(() => {
			messagesQuery.setDelegate(messageQueryChangeDelegate, true)
		})
	})

	const get = (args: Parameters<MessageLintReportsQueryApi["get"]>[0]) => {
		return structuredClone(index.get(args.where.messageId))
	}

	const getAll = () => {
		return structuredClone(
			[...index.values()].flat().length === 0 ? [] : [...index.values()].flat()
		) as MessageLintReport[]
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

const createAwaitable = () => {
	let resolve: () => void
	let reject: () => void

	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- those properties get set by new Promise, TS can't know this
	return { promise, resolve: resolve!, reject: reject! } as unknown as {
		promise: Promise<void>
		resolve: () => void
		reject: (e: unknown) => void
	}
}
