import type { InlangInstance } from "../app/api.js"
import type { LanguageTag } from "../languageTag.js"
import type { Message } from "../messages/schema.js"

export type LintRule = {
	id: `${string}.${string}`
	displayName: TranslatedStrings
	/**
	 * The default level of the lint rule.
	 *
	 * Can be overwritten by the user config.
	 */
	defaultLevel: "error" | "warn"
}

export type MessageLintRule = LintRule & {
	message: (args: { message: Message; inlang: InlangInstance; report: ReportMessageLint }) => void
}

export type ReportMessageLint = (args: {
	messageId: Message["id"]
	languageTag: LanguageTag
	body: LintReport["body"]
}) => MessageLintReport

export type LintReport = {
	ruleId: LintRule["id"]
	level: "error" | "warn"
	body: TranslatedStrings
}

export type MessageLintReport = LintReport & {
	type: "Message"
	messageId: Message["id"]
	languageTag: LanguageTag
}

export class LintException extends Error {
	constructor(message: string) {
		super(message)
		this.name = "LintException"
	}
}

/**
 * Translated strings for a given language tag.
 *
 * The language tag `en` is always required.
 */
type TranslatedStrings = Record<LanguageTag, string> & { en: string }
