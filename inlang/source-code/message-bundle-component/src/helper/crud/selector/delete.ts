import type { Expression, Message } from "@inlang/sdk/v2"

export const deleteSelector = (props: { message: Message; index: number }) => {
	console.log(props.message, props.index)
	props.message.selectors.splice(props.index, 1)
	for (const variant of props.message.variants) {
		variant.match.splice(props.index, 1)
	}
	console.log(props.message, props.index)
}
