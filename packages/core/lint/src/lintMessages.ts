import type { InlangConfig } from "@inlang/config"
import type { Message, MessageQueryApi } from "@inlang/messages"
import type { LintReport, LintRule } from "./api.js"
import { lintMessage } from "./lintMessage.js"
import type { LintError } from "./errors.js"

export const lintMessages = async (args: {
	config: InlangConfig
	rules: LintRule[]
	messages: Message[]
	query: MessageQueryApi
}): Promise<{ data: LintReport[]; errors: LintError[] }> => {
	const promises = args.messages.map((message) =>
		lintMessage({
			config: args.config,
			rules: args.rules,
			messages: args.messages,
			query: args.query,
			message,
		}),
	)

	const results = await Promise.all(promises)

	return {
		data: results.flatMap((result) => result.data).filter(Boolean),
		errors: results.flatMap((result) => result.errors).filter(Boolean),
	}
}
