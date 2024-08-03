import type { Declaration, BundleNested } from "@inlang/sdk2"

/**
 * Deletes an input from all messages of a message bundle.
 * The function mutates the message bundle.
 * @param props.messageBundle The message bundle to delete the input from.
 * @param props.input The input to delete.
 */

const deleteInput = (props: { messageBundle: BundleNested; input: Declaration }) => {
	for (const message of props.messageBundle.messages) {
		const index = message.declarations.findIndex((d: any) => d.name === props.input.name)
		if (index === -1) {
			continue
		} else {
			message.declarations.splice(index, 1)
		}
	}
}

export default deleteInput
