import type { Declaration, MessageBundle } from "@inlang/sdk/v2"

export const getInputs = (props: { messageBundle: MessageBundle }): Declaration[] => {
	const inputs: Declaration[] = []
	for (const message of props.messageBundle.messages) {
		for (const declaration of message.declarations) {
			if (declaration.type === "input" && !inputs.some((d) => d.name === declaration.name)) {
				inputs.push(declaration)
			}
		}
	}
	return inputs
}
