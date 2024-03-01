import { findRepoRoot, _listRemotes } from "@lix-js/client"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"

// TODO: move to lix api when local repos supported
/**
 * Gets the git origin url of the current repository.
 *
 * @params args.filepath filepath override for injecting non cwd path for testing
 * @params args.nodeishFs fs implementation override for injecting virtual fs for testing
 * @returns The git origin url or undefined if it could not be found.
 */
export async function getGitRemotes(
	args: { filepath?: string; nodeishFs?: NodeishFilesystem } = {}
) {
	try {
		const usedFs = args.nodeishFs || fs
		const root = await findRepoRoot({ nodeishFs: usedFs, path: args.filepath || process.cwd() })

		// FIXME: _listRemotes deprecated, use open repo and repo.listRemotes instead
		const remotes = await _listRemotes({
			fs: usedFs,
			dir: root?.replace("file://", ""),
		})
		return remotes
	} catch (e) {
		return undefined
	}
}
