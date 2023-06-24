import type TreeEntry from "./TreeEntry.js"
export default function* readTreeEntries(tree: Uint8Array): Generator<TreeEntry> {
	let cursor = 0
	while (cursor < tree.length) {
		// The only time we can efficiently use `indexOf` and `subArray` since we
		// care about all of the data in the object
		//
		// Also, the treeEntry object return by this function does not include
		// the trailing space or null byte for mode and path respectively.
		const space = tree.indexOf(32, cursor)
		if (space === -1) {
			throw new Error(
				`GitTree: Error parsing tree at byte location ${cursor}: Could not find the next space character.`,
			)
		}

		const nullchar = tree.indexOf(0, cursor)
		if (nullchar === -1) {
			throw new Error(
				`GitTree: Error parsing tree at byte location ${cursor}: Could not find the next null character.`,
			)
		}

		yield {
			modeBuffer: tree.subarray(cursor, space),
			pathBuffer: tree.subarray(space + 1, nullchar),
			oid: tree.subarray(nullchar + 1, nullchar + 21),
		}
		cursor = nullchar + 21
	}
}
