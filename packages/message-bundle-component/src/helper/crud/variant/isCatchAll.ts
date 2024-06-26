import type { Variant } from "@inlang/sdk/v2"

const variantIsCatchAll = (props: { variant: Variant }): boolean => {
	if (props.variant.match.filter((match) => match !== "*").length === 0) {
		return true
	} else {
		return false
	}
}

export default variantIsCatchAll
