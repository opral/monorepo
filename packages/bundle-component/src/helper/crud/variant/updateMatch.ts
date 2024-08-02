import type { Variant } from "@inlang/sdk2"

/**
 * Update the match at the specified index with the new value.
 * The function mutates the variant.
 * @param props.variant The variant to update.
 * @param props.matchIndex The index of the match to update.
 * @param props.value The new value to set at the match index.
 */

const updateMatch = (props: { variant: Variant; selectorName: string; value: string }) => {
	// if matchName is not in variant, return
	if (!props.variant.match[props.selectorName]) return

	// update the match with value (mutates variant)
	props.variant.match[props.selectorName] = props.value
}

export default updateMatch
