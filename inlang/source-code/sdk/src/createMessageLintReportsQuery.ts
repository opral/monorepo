import { createSubscribable } from "./loadProject.js"
import type {
	InlangProject,
	InstalledMessageLintRule,
	MessageLintReportsQueryApi,
	MessageQueryApi,
} from "./api.js"
import type { ProjectSettings } from "@inlang/project-settings"
import type { resolveModules } from "./resolve-modules/index.js"
import type { MessageLintReport } from "./versionedInterfaces.js"
import { lintSingleMessage } from "./lint/index.js"
import { ReactiveMap } from "./reactivity/map.js"

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
	const _settings = settings()

	if (messagesQuery.includedMessageIds() && _settings && modules) {
		for (const messageId of messagesQuery.includedMessageIds()) {
			index.set(
				messageId,
				messagesQuery.get.subscribe({ where: { id: messageId } }, async (message) => {
					await lintSingleMessage({
						rules: modules.messageLintRules,
						settings: {
							..._settings,
							messageLintRuleLevels: Object.fromEntries(
								installedMessageLintRules().map((rule) => [rule.id, rule.level])
							),
						},
						message: message,
					}).then((report) => {
						if (
							report.errors.length === 0 &&
							JSON.stringify(index.get(message.id)) !== JSON.stringify(report.data)
						) {
							index.set(messageId, report.data)
						}
					})
				})
			)
		}
	}

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
