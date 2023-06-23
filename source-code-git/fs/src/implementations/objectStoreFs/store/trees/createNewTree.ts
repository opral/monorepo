import type TreeEntry from "./TreeEntry.js"
export default function createNewTree(entry: TreeEntry) {
	const hashSize = entry.oid.length

	const newTree = new Uint8Array(entry.pathBuffer.length + entry.modeBuffer.length + hashSize)

	newTree.set(entry.modeBuffer, 0)
	newTree.set(entry.pathBuffer, entry.modeBuffer.length)
	newTree.set(entry.oid, entry.modeBuffer.length + entry.pathBuffer.length)

	return newTree
}
