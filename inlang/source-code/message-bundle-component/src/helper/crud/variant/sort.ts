import type { Variant } from "@inlang/sdk/v2"

export const getNewVariantPosition = (props: {
	variants: Variant[]
	newVariant: Variant
}): number => {
	const compareMatches = (variant: Variant, newVariant: Variant, index: number = 0): number => {
		const variantMatch = variant.match[index]
		const newVariantMatch = newVariant.match[index]
		if (variantMatch && newVariantMatch && variantMatch.localeCompare(newVariantMatch) === -1) {
			return -1
		} else if (
			variantMatch &&
			newVariantMatch &&
			variantMatch.localeCompare(newVariantMatch) === 0
		) {
			if (index < variant.match.length - 1) {
				return compareMatches(variant, newVariant, index + 1)
			} else {
				return 0
			}
		} else {
			return 1
		}
	}

	for (let i = 0; i < props.variants.length; i++) {
		const _variant = props.variants[i]
		if (_variant) {
			const comparisonResult = compareMatches(_variant, props.newVariant)
			if (comparisonResult === -1) {
				return i
			}
		}
	}

	return props.variants.length
}
