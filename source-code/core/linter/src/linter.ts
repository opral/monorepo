import { InlangEnvironment, Message, createInlang } from '@inlang/app'
import { lintMessage } from './lintMessage.js'

export const createLinter = async (args: {
	configPath: string
	env: InlangEnvironment
}) => {
	const inlang = await createInlang(args)

	return {
		lintMessage: async (message: Message) => {
			const { data, error } = await lintMessage({ inlang, message })
			// TODO: check if reactivity works
			// TODO: get rid of old entries
			inlang.lint.reports().push(...data)
			// TODO: get rid of old entries
			inlang.lint.exceptions().push(...error)
		},
	}
}

