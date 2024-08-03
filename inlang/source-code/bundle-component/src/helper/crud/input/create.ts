import type { Declaration, BundleNested } from "@inlang/sdk2"

/**
 * Creates an input in all messages of a message bundle.
 * The function mutates the message bundle.
 * @param props.messageBundle The message bundle to create the input in.
 * @param props.inputName The name of the input to create.
 *
 * @example
 * createInput({ messageBundle, inputName: "myInput" })
 */

const createInput = (props: { messageBundle: BundleNested; inputName: string }) => {
	for (const message of props.messageBundle.messages) {
		if (
			message.declarations.some((declaration: Declaration) => declaration.name === props.inputName)
		) {
			console.error("Input with name already exists")
			return
		} else {
			message.declarations.push({
				type: "input",
				name: props.inputName,
				value: {
					type: "expression",
					arg: {
						type: "variable",
						name: props.inputName,
					},
				},
			})
		}
	}
}

export default createInput
