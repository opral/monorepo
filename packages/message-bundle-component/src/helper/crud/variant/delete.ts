import type { Message, Variant } from "@inlang/sdk/v2"

const deleteVariant = (props: { message: Message; variant: Variant }) => {
	const uniqueMatch = props.variant.match
	// index from array where the variant is located
	const index = props.message.variants.findIndex(
		(variant) => JSON.stringify(variant.match) === JSON.stringify(uniqueMatch)
	)

	if (index > -1) {
		// Delete existing variant
		props.message.variants.splice(index, 1)
	}
}

export default deleteVariant
