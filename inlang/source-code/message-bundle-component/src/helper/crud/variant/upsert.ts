import type { Message, Variant } from "@inlang/sdk/v2"

/**
 * Upsert a variant into a message. If a variant with the same match already exists, it will be updated, otherwise a new variant will be added.
 * The function mutates message.
 * @param props.message The message to upsert the variant into.
 * @param props.variant The variant to upsert.
 */

const upsertVariant = (props: { message: Message; variant: Variant }) => {
	const existingVariant = props.message.variants.find((variant) => variant.id === props.variant.id)

	if (existingVariant) {
		// Update existing variant
		existingVariant.pattern = props.variant.pattern
	} else {
		// Insert new variant
		props.message.variants.push(props.variant)
	}
}

export default upsertVariant
