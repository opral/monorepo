import type { Message } from "@inlang/messages"
import { type LanguageTag, WithLanguageTags } from "@inlang/language-tag"
import { Type, type Static, TTemplateLiteral, TLiteral } from "@sinclair/typebox"
import type { JSONSerializableObject } from "@inlang/json-serializable"

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
			pattern: "^(?!project\\.)([a-z]+)\\.(lintRule)\\.([a-z][a-zA-Z0-9]*)$",
			description: "The key must be conform to `{namespace}.lintRule.{name}` pattern.",
			examples: ["example.lintRule.patternInvalid", "example.lintRule.missingTranslation"],
		}) as unknown as TTemplateLiteral<[TLiteral<`${string}.lintRule.${string}`>]>,
		displayName: WithLanguageTags(Type.String()),
		description: WithLanguageTags(Type.String()),
		/* This is used for the marketplace, required if 
			you want to publish your plugin to the marketplace */
		marketplace: Type.Optional(
			Type.Object({
				icon: Type.String(),
				linkToReadme: WithLanguageTags(Type.String()),
				keywords: Type.Array(Type.String()),
				publisherName: Type.String(),
				publisherIcon: Type.String(),
			}),
		),
	}),
	// (in the future, more literals like CodeLint are expected)
	type: Type.Union([Type.Literal("MessageLint")]),
})

/**
 * ---------------- MESSAGE LINT ----------------
 */

export type MessageLintRule<Settings extends JSONSerializableObject | any = any> = Static<
	typeof MessageLintRule
> & {
	message: (args: {
		message: Message
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

export type LintRule<Settings extends JSONSerializableObject | any = any> =
	MessageLintRule<Settings>
export const LintRule = Type.Union([MessageLintRule])

export type LintReport = MessageLintReport

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>
