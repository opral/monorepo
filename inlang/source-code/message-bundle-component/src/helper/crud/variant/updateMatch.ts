import type { Variant } from "@inlang/sdk/v2"

/**
 * Update the match at the specified index with the new value.
 * The function mutates the variant.
 * @param props.variant The variant to update.
 * @param props.matchIndex The index of the match to update.
 * @param props.value The new value to set at the match index.
 */

const updateMatch = (props: { variant: Variant; matchIndex: number; value: string }) => {
	// update the match at index matchIndex with value (mutates variant)
	if (props.matchIndex < 0 || props.matchIndex >= props.variant.match.length) return
	props.variant.match[props.matchIndex] = props.value
}

export default updateMatch
