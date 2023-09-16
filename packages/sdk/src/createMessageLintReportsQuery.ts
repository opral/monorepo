import { createEffect } from "./reactivity/solid.js"
import { createSubscribable } from "./openInlangProject.js"
import type { InlangProject, InstalledMessageLintRule, MessageLintReportsQueryApi } from "./api.js"
import type { ProjectSettings } from "@inlang/project-settings"
import type { resolveModules } from "./resolve-modules/index.js"
import type {
	JSONObject,
	MessageLintReport,
	MessageLintRule,
	Message,
} from "./versionedInterfaces.js"
import { lintSingleMessage } from "./lint/index.js"
import { ReactiveMap } from "./reactivity/map.js"

/**
 * Creates a reactive query API for messages.
 */
export function createMessageLintReportsQuery(
	messages: () => Array<Message> | undefined,
	config: () => ProjectSettings | undefined,
	installedMessageLintRules: () => Array<InstalledMessageLintRule>,
	resolvedModules: () => Awaited<ReturnType<typeof resolveModules>> | undefined,
): InlangProject["query"]["messageLintReports"] {
	// @ts-expect-error
	const index = new ReactiveMap<MessageLintReport["messageId"], MessageLintReport[]>()

	createEffect(() => {
		const msgs = messages()
		const conf = config()
		const modules = resolvedModules()

		if (msgs && conf && modules) {
			// console.log("new calculation")
			// index.clear()
			for (const message of msgs) {
				// TODO: only lint changed messages and update arrays selectively

				lintSingleMessage({
					rules: modules.messageLintRules,
					ruleSettings: conf as Record<MessageLintRule["meta"]["id"], JSONObject>,
					ruleLevels: Object.fromEntries(
						installedMessageLintRules().map((rule) => [rule.meta.id, rule.lintLevel]),
					),
					sourceLanguageTag: conf.sourceLanguageTag,
					languageTags: conf.languageTags,
					messages: msgs,
					message: message,
				}).then((report) => {
					if (
						report.errors.length === 0 &&
						JSON.stringify(index.get(message.id)) !== JSON.stringify(report.data)
					) {
						index.set(message.id, report.data || [])
					}
				})
			}
		}
	})

	const get = (args: Parameters<MessageLintReportsQueryApi["get"]>[0]) => {
		return structuredClone(index.get(args.where.messageId))
	}

	return {
		getAll: createSubscribable(() => {
			return structuredClone(
				[...index.values()].flat().length === 0 ? [] : [...index.values()].flat(),
			)
		}),
		get: Object.assign(get, {
			subscribe: (
				args: Parameters<MessageLintReportsQueryApi["get"]["subscribe"]>[0],
				callback: Parameters<MessageLintReportsQueryApi["get"]["subscribe"]>[1],
			) => createSubscribable(() => get(args)).subscribe(callback),
		}) as any,
	}
}
