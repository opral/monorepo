import type { InlangInstance } from '@inlang/app';
import { createMessage } from '../../../../test.util.js';

export const createDemoResourcesIfNoMessagesExistYet = async (inlang: InlangInstance) => {
	const messages = inlang.query.messages.getAll()
	if (messages.length) return

	inlang.query.messages.create({
		data: createMessage('welcome', {
			en: 'Welcome to inlang',
			de: 'Willkommen bei inlang',
		}),
	})
}
