import type { Declaration, MessageBundle } from "@inlang/sdk/v2"

const deleteInput = (props: { messageBundle: MessageBundle; input: Declaration }) => {
	for (const message of props.messageBundle.messages) {
		const index = message.declarations.findIndex((d) => d.name === props.input.name)
		if (index === -1) {
			continue
		} else {
			message.declarations.splice(index, 1)
		}
	}
}

export default deleteInput
