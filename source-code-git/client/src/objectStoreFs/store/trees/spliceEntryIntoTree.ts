import type TreeEntry from "./TreeEntry.js"
/**
 * Insert a new object reference into a tree object
 *
 * This is a slight modification to the code in `updateEntryInTree`,
 * instead of finding an object id, we find the index where the a new path
 * should be inserted alphabetically.
 */
export default function spliceEntryIntoTree(oldTree: Uint8Array, entry: TreeEntry): Uint8Array {
	// create a new tree with room for the new entry
	const newTree = new Uint8Array(
		oldTree.length + entry.modeBuffer.length + entry.pathBuffer.length + entry.oid.length,
	)
	// copy the old tree into the new one
	newTree.set(oldTree, 0)

	const hashSize = entry.oid.length
	const treeEntrySize = entry.modeBuffer.length + entry.pathBuffer.length + hashSize
	// skip the first mode, and following space
	let i = newTree[0] === 52 ? 6 : 7

	let pathIndex = 0
	let insertPointIndex = 0 // index in the tree where the path sorts
	let matching = true // assume the strings are equal at the start

	for (; i < newTree.length; ++i) {
		// TypeScript complains about unchecked index access here, but even
		// if the indicies evaluate to 'undefined', the code will still
		// perform as expected.
		// @ts-ignore
		if (matching && entry.pathBuffer[pathIndex] < newTree[i]) break
		// @ts-ignore
		if (entry.pathBuffer[pathIndex] > newTree[i]) matching = false

		matching = matching && entry.pathBuffer[pathIndex] === newTree[i]
		++pathIndex

		if (newTree[i] !== 0) continue

		matching = true
		pathIndex = 0
		insertPointIndex = i + hashSize + 1
		i += newTree[i + hashSize + 1] === 52 ? hashSize + 6 : hashSize + 7
	}

	// Item sorts at the end of the tree, so set the insert point to the
	// end of the tree contents
	if (i >= newTree.length) insertPointIndex = newTree.length - treeEntrySize
	else
		newTree.copyWithin(
			// shift the tree contents over to make room for the new entry
			insertPointIndex + treeEntrySize,
			insertPointIndex,
			newTree.length,
		)
	// write the new entry
	newTree.set(entry.modeBuffer, insertPointIndex) // mode
	newTree.set(entry.pathBuffer, insertPointIndex + entry.modeBuffer.length) // path
	newTree.set(entry.oid, insertPointIndex + entry.modeBuffer.length + entry.pathBuffer.length) // oid

	return newTree
}
