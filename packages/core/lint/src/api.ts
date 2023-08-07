import type { Message, MessageQueryApi } from "@inlang/messages"
import { type LanguageTag, TranslatedStrings } from "@inlang/language-tag"
import type { InlangConfig } from "@inlang/config"
import { Type, type Static, TTemplateLiteral, TLiteral } from "@sinclair/typebox"

export type LintLevel = Static<typeof LintLevel>

export const LintLevel = Type.Union([Type.Literal("error"), Type.Literal("warning")])

export type LintRule = Static<typeof LintRule>

export const LintRule = Type.Object(
	{
		meta: Type.Object({
			id: Type.String({
				pattern: "^[a-z0-9-]+\\.[a-z0-9-]+$",
				examples: ["example.my-plugin"],
			}) as unknown as TTemplateLiteral<[TLiteral<`${string}.${string}`>]>,
			displayName: TranslatedStrings,
			description: TranslatedStrings,
		}),
		/**
		 * The default level of the lint rule.
		 *
		 * The default level exists as a fallback if the user
		 * did not specify a level for the rule in the settings.
		 */
		defaultLevel: LintLevel,
	},
	{ additionalProperties: false },
)

export type MessageLintRule<
	RuleOptions extends JSONSerializable<unknown> = Record<string, string> | unknown,
> = LintRule & {
	message: (args: {
		message: Message
		query: Pick<MessageQueryApi, "get">
		config: Readonly<InlangConfig>
		options: RuleOptions
		report: ReportMessageLint
	}) => MaybePromise<void>
}

// TODO: make it a general type for other packages to use
type JSONSerializable<
	T extends Record<string, string | string[] | Record<string, string | string[]>> | unknown,
> = T

// TODO: make it a general type for other packages to use
type MaybePromise<T> = T | Promise<T>

export type ReportMessageLint = (args: {
	messageId: Message["id"]
	languageTag: LanguageTag
	body: LintReport["body"]
}) => void

export type LintReport = {
	ruleId: LintRule["meta"]["id"]
	level: LintLevel
	body: TranslatedStrings
}

export type MessageLintReport = LintReport & {
	type: "MessageLint"
	messageId: Message["id"]
	languageTag: LanguageTag
}

export class LintException extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = "LintException"
	}
}
