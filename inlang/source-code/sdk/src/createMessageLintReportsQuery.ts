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

	const lintMessage = (message: Message, messages: Message[]) => {
		if (!rulesArray) {
			return
		}
		lintSingleMessage({
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
	}

	const messages = messagesQuery.getAll() as Message[]
	// load report for all messages once
	for (const message of messages) {
		lintMessage(message, messages)
	}

	const messageQueryChangeDelegate: MessageQueryDelegate = {
		onCleanup: () => {
			// TODO cancel all running lint rules
			// TODO clear reaports map
		},
		onLoaded: (messages: Message[]) => {
			// TODO queue a lintSingleMessage for each message
			for (const message of messages) {
				lintMessage(message, messages)
			}
		},
		onMessageCreate: (messageId: string, message: Message) => {
			// TODO check if the message store is fully loaded
			if (!rulesArray) {
				return
			}
			lintMessage(message, messages)
		},
		onMessageUpdate: (messageId: string, message: Message) => {
			lintMessage(message, messages)
		},
		onMessageDelete: (messageId: string) => {
			index.delete(messageId)
		},
	}

	messagesQuery.setDelegate(messageQueryChangeDelegate)

	return {
		getAll: async () => {
			// TODO reintroduce reactivity here
			await sleep(0) // evaluate on next tick to allow for out-of-order effects
			return structuredClone(
				[...index.values()].flat().length === 0 ? [] : [...index.values()].flat()
			)
		},
		get: async (args: Parameters<MessageLintReportsQueryApi["get"]>[0]) => {
			// TODO reintroduce reactivity here
			await sleep(0) // evaluate on next tick to allow for out-of-order effects
			return structuredClone(index.get(args.where.messageId) ?? [])
		},
	}
}
