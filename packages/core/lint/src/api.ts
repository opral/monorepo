import type { Message, MessageQueryApi } from "@inlang/messages"
import type { LanguageTag, TranslatedStrings } from "@inlang/language-tag"
import type { InlangConfig } from "@inlang/config"

export type LintLevel = "error" | "warn"

export type LintRule = {
	id: `${string}.${string}`
	displayName: TranslatedStrings
	/**
	 * The default level of the lint rule.
	 *
	 * Can be overwritten by the user config.
	 */
	defaultLevel: LintLevel
}

export type MessageLintRule = LintRule & {
	message: (args: {
		message: Message
		query: Pick<MessageQueryApi, "get">
		config: Readonly<InlangConfig>
		report: ReportMessageLint
	}) => void
}

export type ReportMessageLint = (args: {
	messageId: Message["id"]
	languageTag: LanguageTag
	body: LintReport["body"]
}) => MessageLintReport

export type LintReport = {
	ruleId: LintRule["id"]
	level: LintLevel
	body: TranslatedStrings
}

export type MessageLintReport = LintReport & {
	type: "MessageLint"
	messageId: Message["id"]
	languageTag: LanguageTag
}

export class LintException extends Error {
	constructor(message: string) {
		super(message)
		this.name = "LintException"
	}
}
