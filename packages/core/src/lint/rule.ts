import type { InlangConfig } from "../config/index.js"
import type * as ast from "../ast/index.js"
import type { LanguageTag } from "../languageTag/types.js"

/**
 * A lint rule that was configured with the lint level and lint specific settings.
 */
export type LintRule = {
	id: `${string}.${string}`
	// TODO change to 'defaultLevel' for https://github.com/inlang/inlang/issues/1140 ?
	// a rule can have a default level, but the user can override it in the user config
	level: "error" | "warn"
	message: (args: {
		message: ast.Message
		messages: ast.Message[]
		config: Pick<InlangConfig, "sourceLanguageTag" | "languageTags">
	}) => MaybePromise<void | Pick<LintReport, "messageId" | "languageTag" | "content">>
}

/**
 * A report of a given lint rule.
 */
export type LintReport = {
	ruleId: LintRule["id"]
	level: LintRule["level"]
	messageId: ast.Message["id"]
	languageTag: LanguageTag
	content: string
}

export type MaybePromise<T> = T | Promise<T>
