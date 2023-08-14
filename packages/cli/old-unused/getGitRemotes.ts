import { raw } from "@inlang-git/client/raw"
import fs from "node:fs"

/**
 * Gets the git origin url of the current repository.
 *
 * @returns The git origin url or undefined if it could not be found.
 */
export async function getGitRemotes() {
	try {
		const remotes = await raw.listRemotes({
			fs,
			dir: await raw.findRoot({ fs, filepath: process.cwd() }),
		})
		return remotes
	} catch (e) {
		return undefined
	}
}
