import { raw } from "@inlang-git/client/raw"
import type { NodeishFilesystem } from "@inlang-git/fs"

/**
 * Gets the git origin url of the current repository.
 *
 * @returns The git origin url or undefined if it could not be found.
 */
export async function getGitRemotes(args: { fs: NodeishFilesystem }) {
	try {
		const remotes = await raw.listRemotes({
			fs: args.fs,
			dir: await raw.findRoot({ fs: args.fs, filepath: "/" }),
		})
		return remotes
	} catch (e) {
		return undefined
	}
}
