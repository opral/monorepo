import type { InlangConfig } from '@inlang/config';
import type { Message, MessageQueryApi } from '@inlang/messages';
import type { LintException, LintReport } from './api.js';
import { lintMessage } from './lintMessage.js';
import type { SuccessWithErrorResult } from '@inlang/result'

export const lintMessages = async (args: {
	config: InlangConfig,
	messages: Message[],
	query: MessageQueryApi
}): Promise<SuccessWithErrorResult<LintReport[], LintException[]>> => {
	const promises = args.messages.map(message => lintMessage({
		config: args.config,
		messages: args.messages,
		query: args.query,
		message
	}))

	const results = await Promise.all(promises)

	return {
		data: results.flatMap(result => result.data).filter(Boolean),
		error: results.flatMap(result => result.error).filter(Boolean)
	}
}