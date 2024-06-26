import { type Variant } from "@inlang/sdk/v2"

/**
 * Sort all variants by their match values.
 * The function does not mutate the variants array.
 * @param props.variants The variants to sort. The variants will be sorted in place.
 * @param props.ignoreVariantIds The ids of the variants to ignore in the sorting. These variants will be placed at the end of the list.
 * @returns The sorted variants.
 */
const sortAllVariants = (props: { variants: Variant[]; ignoreVariantIds: string[] }): Variant[] => {
	const sortedVariants: Variant[] = structuredClone(props.variants)
	sortedVariants.sort((a, b) => {
		return compareValues(a, b, 0, props.ignoreVariantIds)
	})
	return sortedVariants
}

const compareValues = (
	a: Variant,
	b: Variant,
	index: number,
	ignoreVariantIds: string[]
): number => {
	if (a.match[index] && b.match[index]) {
		if (ignoreVariantIds.includes(a.id)) return 1
		if (a.match[index]! < b.match[index]!) return 1
		if (a.match[index]! > b.match[index]!) return -1
	}
	if (a.match.length === index + 1) return 0
	if (index > 10) return 0
	return compareValues(a, b, index + 1, ignoreVariantIds)
}

export default sortAllVariants
