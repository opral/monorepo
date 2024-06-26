import type { Variant } from "@inlang/sdk/v2"

/**
 * Returns true if the variant has a catch-all match.
 * @param props.variant The variant to check.
 * @returns True if the variant has a catch-all match.
 */
const variantIsCatchAll = (props: { variant: Variant }): boolean => {
	if (props.variant.match.filter((match) => match !== "*").length === 0) {
		return true
	} else {
		return false
	}
}

export default variantIsCatchAll
