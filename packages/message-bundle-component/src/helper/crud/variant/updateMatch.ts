import type { Variant } from "@inlang/sdk/v2"

const updateMatch = (props: { variant: Variant; matchIndex: number; value: string }) => {
	// update the match at index matchIndex with value (mutates variant)
	props.variant.match[props.matchIndex] = props.value
}

export default updateMatch
