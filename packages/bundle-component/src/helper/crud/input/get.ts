import type { Declaration, Message } from "@inlang/sdk2"

/**
 * Gets all inputs from a message bundle.
 * @param props.messageBundle The message bundle to get the inputs from.
 * @returns All inputs from the message bundle.
 */

const getInputs = (props: { messages: Message[] }): Declaration[] => {
	const inputs: Declaration[] = []
	for (const message of props.messages) {
		for (const declaration of message.declarations) {
			if (declaration.type === "input" && !inputs.some((d) => d.name === declaration.name)) {
				inputs.push(declaration)
			}
		}
	}
	return inputs
}

export default getInputs
