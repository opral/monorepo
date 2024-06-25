/**
 * This function sorts an array of filenames, performs a binary search to find
 * the appropriate insertion point for a fallback name, and then returns a new
 * array where the filenames are rotated so that
 * the fallback name (or the * nearest filename) appears first in the array.
 * @param slotFileNames
 * @param fallbackName
 * @returns
 */
export function sortNamesByDistance(slotFileNames: string[], fallbackName: string) {
	slotFileNames.sort()
	let low = 0,
		high = slotFileNames.length

	while (low < high) {
		const mid = Math.floor((low + high) / 2)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (slotFileNames[mid]! <= fallbackName) {
			low = mid + 1
		} else {
			high = mid
		}
	}

	const slotFileNamesByDistance = []

	for (let i = 0; i < slotFileNames.length; i++) {
		const index = (i + low) % slotFileNames.length
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- mod should not create out of index
		slotFileNamesByDistance.push(slotFileNames[index]!)
	}
	return slotFileNamesByDistance
}
