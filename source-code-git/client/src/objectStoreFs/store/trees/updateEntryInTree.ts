import type TreeEntry from "./TreeEntry.js"
/*
 * Update the existing entry in `tree` with the data contained in `entry`
 */
export default function updateEntryInTree(
	tree: Uint8Array,
	entry: TreeEntry,
): Uint8Array | undefined {
	// Child hash size is consistent with parent hash size.
	// https://git-scm.com/docs/hash-function-transition
	const hashSize = entry.oid.length

	// Because we know how git tree objects are formatted, we can implement
	// a linear search alogrithm to find the target path:
	//
	// 1. Skip the n bytes up to the next path.
	// 2. Read through the path
	// 3. If the path doesn't match, repeat step 1

	// skip the first mode, and following space
	let i = tree[0] === 52 ? 6 : 7

	let pathIndex = 0 // index we are comparing between the given path and the target path
	let pathIsMatching = true // whether the target path matches the given path so far

	for (; i < tree.length; ++i) {
		pathIsMatching = pathIsMatching && tree[i] === entry.pathBuffer[pathIndex]

		++pathIndex

		if (pathIsMatching && tree[i] === 0) break
		if (!pathIsMatching) pathIndex = 0
		if (tree[i] !== 0) continue

		pathIsMatching = true
		i += tree[i + hashSize + 1] === 52 ? hashSize + 6 : hashSize + 7
	}

	// Path not found in parent tree, return undefined
	if (i >= tree.length) return

	// Path has been found, update the oid and return the new tree
	tree.set(entry.oid, i + 1)
	return tree
}
