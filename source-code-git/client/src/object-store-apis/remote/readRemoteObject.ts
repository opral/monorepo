import type { NodeishFilesystem } from "@inlang-git/fs"
//TODO: Test with trees larger than 64k
//TODO: index.ts

/*
 * Given a packed object, parse and write it to the appropriate location in
 * `gitdir` on the filesystem `fs`
 */
async function writePackedObjectToDir(
	object: ArrayBuffer,
	gitdir: string,
	fs: NodeishFilesystem
) {
}
