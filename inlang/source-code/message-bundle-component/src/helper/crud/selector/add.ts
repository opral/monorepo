import type { Expression, Message } from "@inlang/sdk/v2"

export const addSelector = (props: { message: Message; selector: Expression }) => {
	props.message.selectors.push(props.selector)
	for (const variant of props.message.variants) {
		variant.match.push("*")
	}
}
