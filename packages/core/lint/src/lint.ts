import type { InlangConfig } from '@inlang/config';
import type { Message, MessageQueryApi } from '@inlang/messages';
import type { LintException, LintReport } from './api.js';
import { lintMessage } from './lintMessage.js';
// @ts-ignore
import type { SuccessWithErrorResult } from '@inlang/result'

export const lint = async (args: {
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

	const results = await Promise.allSettled(promises)


	return {
		data: results.map(result => result.data).filter(Boolean),
		error: results.map(result => result.error).filter(Boolean)
	}
}