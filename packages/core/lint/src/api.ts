import type { Message, MessageQueryApi } from "@inlang/messages"
import { type LanguageTag, WithLanguageTags } from "@inlang/language-tag"
import { Type, type Static, TTemplateLiteral, TLiteral } from "@sinclair/typebox"
import type { InlangConfig } from "@inlang/config"

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
	body: WithLanguageTags<string>
}

/**
 * The basis of a lint rule (required to contruct a lint rule union type)
 */
export type LintRuleBase = Static<typeof LintRuleBase>
export const LintRuleBase = Type.Object({
	meta: Type.Object({
		id: Type.String({
			pattern: "^(?!system\\.)([a-z]+)\\.(lintRule)\\.([a-z][a-zA-Z0-9]*)$",
			description: "The key must be conform to `{namespace}.lintRule.{name}` pattern.",
			examples: ["example.lintRule.patternInvalid", "example.lintRule.missingMessage"],
		}) as unknown as TTemplateLiteral<[TLiteral<`${string}.lintRule.${string}`>]>,
		displayName: WithLanguageTags(Type.String()),
		description: WithLanguageTags(Type.String()),
	}),
	// (in the future, more literals like CodeLint are expected)
	type: Type.Union([Type.Literal("MessageLint")]),
})

/**
 * ---------------- MESSAGE LINT ----------------
 */

export type MessageLintRule<
	Settings extends InlangConfig["settings"][LintRule["meta"]["id"]] | any = any,
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
	Settings extends InlangConfig["settings"][LintRule["meta"]["id"]] | any = any,
> = MessageLintRule<Settings>
export const LintRule = Type.Union([MessageLintRule])

export type LintReport = MessageLintReport

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>
