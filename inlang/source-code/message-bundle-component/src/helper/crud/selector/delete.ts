import type { Expression, Message } from "@inlang/sdk/v2"

const deleteSelector = (props: { message: Message; index: number }) => {
	props.message.selectors.splice(props.index, 1)
	for (const variant of props.message.variants) {
		variant.match.splice(props.index, 1)
	}
}

export default deleteSelector
