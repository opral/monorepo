import type { MessageBundle } from "@inlang/sdk/v2"

export const getInputs = (props: { messageBundle: MessageBundle }) => {
	const inputs: string[] = []
	for (const message of props.messageBundle.messages) {
		for (const declaration of message.declarations) {
			if (declaration.type === "input" && !inputs.includes(declaration.name)) {
				inputs.push(declaration.name)
			}
		}
	}
	return inputs
}
