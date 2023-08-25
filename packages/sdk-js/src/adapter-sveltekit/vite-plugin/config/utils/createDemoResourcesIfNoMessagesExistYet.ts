import type { InlangProject } from "@inlang/app"
// eslint-disable-next-line no-restricted-imports
import { createMessage } from "@inlang/test"

export const createDemoResourcesIfNoMessagesExistYet = async (inlang: InlangProject) => {
	const messages = inlang.query.messages.getAll()
	if (Object.values(messages).length) return

	inlang.query.messages.create({
		data: createMessage("welcome", {
			en: "Welcome to inlang",
			de: "Willkommen bei inlang",
		}),
	})
}
