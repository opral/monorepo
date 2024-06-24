import { createVariant, type Expression, type Message } from "@inlang/sdk/v2"

export const addSelector = (props: { message: Message; selector: Expression }) => {
	props.message.selectors.push(props.selector)
	if (props.message.variants.length !== 0) {
		for (const variant of props.message.variants) {
			variant.match.push("*")
		}
	} else {
		props.message.variants.push(createVariant({ match: ["*"], text: "" }))
	}
}
