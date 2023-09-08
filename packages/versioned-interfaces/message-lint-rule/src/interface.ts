import type { Message } from "@inlang/message"
import type { LanguageTag } from "@inlang/language-tag"
import { Translatable } from "@inlang/translatable"
import { Type, type Static, type TTemplateLiteral, type TLiteral } from "@sinclair/typebox"
import type { JSONObject } from "@inlang/json-types"

export type MessageLintLevel = Static<typeof MessageLintLevel>
export const MessageLintLevel = Type.Union([Type.Literal("error"), Type.Literal("warning")])

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export type MessageLintReport = {
	ruleId: MessageLintRule["meta"]["id"]
	messageId: Message["id"]
	languageTag: LanguageTag
	level: MessageLintLevel
	body: Translatable<string>
}

export type MessageLintRule<LintRuleSettings extends JSONObject | any = any> = Static<
	typeof MessageLintRule
> & {
	message: (args: {
		message: Message
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
		settings: LintRuleSettings
		report: (args: {
			messageId: Message["id"]
			languageTag: LanguageTag
			body: MessageLintReport["body"]
		}) => void
	}) => MaybePromise<void>
}
export const MessageLintRule = Type.Object({
	meta: Type.Object({
		id: Type.String({
			pattern: "^messageLintRule\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
			description: "The key must be conform to `messageLintRule.{namespace}.{id}` pattern.",
			examples: [
				"messageLintRule.namespace.patternInvalid",
				"messageLintRule.namespace.missingTranslation",
			],
		}) as unknown as TTemplateLiteral<[TLiteral<`messageLintRule.${string}.${string}`>]>,
		displayName: Translatable(Type.String()),
		description: Translatable(Type.String()),
	}),
})

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>
