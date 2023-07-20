import type { InlangApp } from "../app/api.js"
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

// TODO better "message" agnostic way for linting system?
// - Trying to make the lint system "message" agnostic.
//
export type MessageLintRule = LintRule & {
	type: "Message"
	message: (args: {
		message: Message
		inlang: InlangApp
	}) => MaybeArray<Omit<MessageLintReport, "ruleId" | "level" | "type">> | undefined | void
}

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

type MaybeArray<T> = T | T[]
