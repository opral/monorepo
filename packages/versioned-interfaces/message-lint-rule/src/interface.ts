import type { Message } from "@inlang/message"
import type { LanguageTag } from "@inlang/language-tag"
import { Translatable } from "@inlang/translatable"
import { Type, type Static } from "@sinclair/typebox"
import {
	_MessageLintRuleId,
	_MessageLintRuleLevel,
	type ProjectSettings,
} from "@inlang/project-settings"

export type MessageLintLevel = Static<typeof MessageLintLevel>
export const MessageLintLevel = _MessageLintRuleLevel

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export type MessageLintReport = {
	ruleId: MessageLintRule["id"]
	messageId: Message["id"]
	languageTag: LanguageTag
	level: MessageLintLevel
	body: Translatable<string>
}

export type MessageLintRule = Static<typeof MessageLintRule> & {
	run: (args: {
		message: Message
		settings: ProjectSettings
		report: (args: {
			messageId: Message["id"]
			languageTag: LanguageTag
			body: MessageLintReport["body"]
		}) => void
	}) => MaybePromise<void>
}
export const MessageLintRule = Type.Object({
	id: _MessageLintRuleId,
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),
})

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>
