import type { InlangInstance } from "../app/api.js"
import type { LanguageTag } from "../languageTag.js"
import type { Message } from "../messages/schema.js"

export type LintRule = {
	id: `${string}.${string}`
	displayName: Record<string, string>
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
	content: LintReport["content"]
}) => MessageLintReport

export type LintReport = {
	ruleId: LintRule["id"]
	level: "error" | "warn"
	content: string
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
