import type { MessageNested } from "@inlang/sdk2"

/**
 * Deletes a selector from a message.
 * The function mutates the message.
 * @param props.message The message to delete the selector from.
 * @param props.index The index of the selector to delete.
 *
 * @example
 * deleteSelector({ message, index: 0 })
 */

const deleteSelector = (props: { message: MessageNested; index: number }) => {
	const selectorName = props.message.selectors[props.index]!.arg.name
	if (selectorName) {
		props.message.selectors.splice(props.index, 1)
		for (const variant of props.message.variants) {
			for (const name in variant.match) {
				if (name === selectorName) {
					delete variant.match[name]
				}
			}
		}
	} else {
		console.error("Index is not pointing on a selector")
	}
}

export default deleteSelector
