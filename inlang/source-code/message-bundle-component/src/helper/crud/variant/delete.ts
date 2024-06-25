import type { Message, Variant } from "@inlang/sdk/v2"

const deleteVariant = (props: { message: Message; variant: Variant }) => {
	// index from array where the variant is located
	const index = props.message.variants.findIndex((variant) => variant.id === props.variant.id)

	if (index > -1) {
		// Delete existing variant
		props.message.variants.splice(index, 1)
	}
}

export default deleteVariant
