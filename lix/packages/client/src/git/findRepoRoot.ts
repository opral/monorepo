import type { NodeishFilesystem } from "@lix-js/fs"
import { findRoot } from "../../vendored/isomorphic-git/index.js"

// returns as valid lix url, this is needed to pass the return value of findRepoRoot directly to openRepository which is the main use for this function
export async function findRepoRoot(args: {
	nodeishFs: NodeishFilesystem
	path: string
}): Promise<string | undefined> {
	const gitroot = await findRoot({
		fs: args.nodeishFs,
		filepath: args.path,
	}).catch(() => undefined)

	return gitroot ? "file://" + gitroot : undefined
}
