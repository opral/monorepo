import { createEffect } from "./reactivity/solid.js"
import { createSubscribable } from "./loadProject.js"
import type { InlangProject, InstalledMessageLintRule, MessageLintReportsQueryApi } from "./api.js"
import type { ProjectSettings } from "@inlang/project-settings"
import type { resolveModules } from "./resolve-modules/index.js"
import type { MessageLintReport, Message } from "./versionedInterfaces.js"
import { lintSingleMessage } from "./lint/index.js"
import { ReactiveMap } from "./reactivity/map.js"

/**
 * Creates a reactive query API for messages.
 */
export function createMessageLintReportsQuery(
	messages: () => Array<Message> | undefined,
	settings: () => ProjectSettings,
	installedMessageLintRules: () => Array<InstalledMessageLintRule>,
	resolvedModules: () => Awaited<ReturnType<typeof resolveModules>> | undefined,
): InlangProject["query"]["messageLintReports"] {
	// @ts-expect-error
	const index = new ReactiveMap<MessageLintReport["messageId"], MessageLintReport[]>()

	createEffect(() => {
		const modules = resolvedModules()
		const _messages = messages()
		const _settings = settings()

		if (_messages && _settings && modules) {
			// console.log("new calculation")
			// index.clear()
			for (const message of _messages) {
				// TODO: only lint changed messages and update arrays selectively

				lintSingleMessage({
					rules: modules.messageLintRules,
					settings: {
						..._settings,
						messageLintRuleLevels: Object.fromEntries(
							installedMessageLintRules().map((rule) => [rule.id, rule.level]),
						),
					},
					messages: _messages,
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
