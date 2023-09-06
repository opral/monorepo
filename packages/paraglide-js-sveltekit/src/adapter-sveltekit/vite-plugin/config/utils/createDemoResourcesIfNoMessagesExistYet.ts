import type { InlangProject } from "@inlang/sdk"
import { createMessage } from "../../../../../../sdk/dist/test-utilities/createMessage.js"

export const createDemoResourcesIfNoMessagesExistYet = async (inlang: InlangProject) => {
	const messages = inlang.query.messages.getAll()
	if (messages.length) return

	inlang.query.messages.create({
		data: createMessage("welcome", {
			en: "Welcome to inlang",
			de: "Willkommen bei inlang",
		}),
	})
}
