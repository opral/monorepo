import type { NestedMessage } from "@inlang/sdk-v2"

/**
 * Deletes a selector from a message.
 * The function mutates the message.
 * @param props.message The message to delete the selector from.
 * @param props.index The index of the selector to delete.
 *
 * @example
 * deleteSelector({ message, index: 0 })
 */

const deleteSelector = (props: { message: NestedMessage; index: number }) => {
	props.message.selectors.splice(props.index, 1)
	for (const variant of props.message.variants) {
		for (const name in Object.keys(variant.match)) {
			if (name === props.message.selectors[props.index]!.arg.name) {
				delete variant.match[name]
			}
		}
	}
}

export default deleteSelector
