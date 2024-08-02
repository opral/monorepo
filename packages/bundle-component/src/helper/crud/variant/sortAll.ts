import { type Expression, type Variant } from "@inlang/sdk2"

/**
 * Sort all variants by their match values.
 * The function does not mutate the variants array.
 * @param props.variants The variants to sort. The variants will be sorted in place.
 * @param props.ignoreVariantIds The ids of the variants to ignore in the sorting. These variants will be placed at the end of the list.
 * @returns The sorted variants.
 */
const sortAllVariants = (props: {
	variants: Variant[]
	ignoreVariantIds: string[]
	selectors: Expression[]
}): Variant[] => {
	const sortedVariants: Variant[] = structuredClone(props.variants)
	sortedVariants.sort((a, b) => {
		return compareValues(a, b, 0, props.ignoreVariantIds, props.selectors)
	})
	return sortedVariants
}

const compareValues = (
	a: Variant,
	b: Variant,
	index: number,
	ignoreVariantIds: string[],
	selectors: Expression[]
): number => {
	const selectorName = selectors[index]?.arg.name
	if (!selectorName) return 0

	if (a.match[selectorName] && b.match[selectorName]) {
		if (ignoreVariantIds.includes(a.id)) return 1
		if (a.match[selectorName]! < b.match[selectorName]!) return 1
		if (a.match[selectorName]! > b.match[selectorName]!) return -1
	}

	if (Object.values(a.match).length === index + 1) return 0
	if (index > 10) return 0
	return compareValues(a, b, index + 1, ignoreVariantIds, selectors)
}

export default sortAllVariants
