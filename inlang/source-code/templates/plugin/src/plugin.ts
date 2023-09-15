import { Plugin } from "@inlang/sdk"
import { id, displayName, description } from "../marketplace-manifest.json"
import { createMessage } from "@inlang/sdk/test-utilities"

export const plugin: Plugin = {
	meta: {
		id: id as Plugin["meta"]["id"],
		displayName,
		description,
	},
	loadMessages: async () => {
		console.info("loadMessages called")
		const fakeMessages = [
			createMessage("this-is-a-test-message", {
				en: "Hello world!",
			}),
		]
		return fakeMessages
	},
	saveMessages: (args) => {
		console.info("saveMessages called with ", args.messages)
	},
}
