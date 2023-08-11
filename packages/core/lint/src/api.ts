import type { Message, MessageQueryApi } from "@inlang/messages"
import { type LanguageTag, TranslatedStrings } from "@inlang/language-tag"
import type { InlangConfig } from "@inlang/config"
import { Type, type Static, TTemplateLiteral, TLiteral } from "@sinclair/typebox"

/**
 * ---------------- BASIS ----------------
 */

export type LintLevel = Static<typeof LintLevel>
export const LintLevel = Type.Union([Type.Literal("error"), Type.Literal("warning")])

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export type LintReportBase = {
	ruleId: LintRuleBase["meta"]["id"]
	type: LintRuleBase["type"]
	level: LintLevel
	body: TranslatedStrings
}

/**
 * The basis of a lint rule (required to contruct a lint rule union type)
 */
export type LintRuleBase = Static<typeof LintRuleBase>
export const LintRuleBase = Type.Object({
	meta: Type.Object({
		id: Type.String({
			pattern: "^(?:[a-zA-Z0-9]+(?:\\.[a-zA-Z0-9]+)*)\\.lintRule[a-zA-Z][a-zA-Z0-9]*$",
			description: "The key must be conform to the `{namespace}.{key}` pattern.",
			examples: ["example.pluginSqlite", "example.lintRuleMissingMessage"],
		}) as unknown as TTemplateLiteral<[TLiteral<`${string}.lintRule${string}`>]>,
		displayName: TranslatedStrings,
		description: TranslatedStrings,
	}),
	// (in the future, more literals like CodeLint are expected)
	type: Type.Union([Type.Literal("MessageLint")]),
	/**
	 * The default level of the lint rule.
	 *
	 * The default level exists as a fallback if the user
	 * did not specify a level for the rule in the settings.
	 */
	defaultLevel: LintLevel,
})

/**
 * ---------------- MESSAGE LINT ----------------
 */

export type MessageLintRule<
	Settings extends InlangConfig["settings"][LintRuleBase["meta"]["id"]] | unknown = unknown,
> = Static<typeof MessageLintRule> & {
	message: (args: {
		message: Message
		query: Pick<MessageQueryApi, "get">
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
		settings: Settings
		report: (args: {
			messageId: Message["id"]
			languageTag: LanguageTag
			body: LintReportBase["body"]
		}) => void
	}) => MaybePromise<void>
}
export const MessageLintRule = Type.Intersect([
	LintRuleBase,
	Type.Object({
		type: Type.Literal("MessageLint"),
	}),
])

export type MessageLintReport = LintReportBase & {
	type: "MessageLint"
	messageId: Message["id"]
	languageTag: LanguageTag
}

/**
 * ---------------- LINT ----------------
 */

export type LintRule<
	// must be any to avoid typescript complaining about "recursive types"
	Settings extends InlangConfig["settings"][LintRuleBase["meta"]["id"]] | unknown = any,
> = MessageLintRule<Settings>
export const LintRule = Type.Union([MessageLintRule])

export type LintReport = MessageLintReport

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>
