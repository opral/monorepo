import type { Message, MessageQueryApi } from "@inlang/messages"
import type { LanguageTag, TranslatedStrings } from "@inlang/language-tag"
import type { InlangConfig } from "@inlang/config"

export type LintLevel = "error" | "warning"

export type LintRule = {
	meta: {
		id: `${string}.${string}`
		displayName: TranslatedStrings
		description: TranslatedStrings
		/**
		 * The default level of the lint rule.
		 *
		 * The default lint level is added to the user config
		 * on first run.
		 */
		defaultLevel: LintLevel
	}
}

export type MessageLintRule = LintRule & {
	message: (args: {
		message: Message
		query: Pick<MessageQueryApi, "get">
		config: Readonly<InlangConfig>
		report: ReportMessageLint
	}) => MaybePromise<void>
}

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
	constructor(message: string) {
		super(message)
		this.name = "LintException"
	}
}
