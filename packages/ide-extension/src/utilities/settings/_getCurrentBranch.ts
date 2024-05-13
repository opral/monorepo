/**
 * Gets current git branch of the currently opened repository.
 */

import { findRepoRoot, openRepository } from "@lix-js/client"
import type { NodeishFilesystem } from "@lix-js/fs"

export async function _getCurrentBranch({
	fs,
	workspaceRoot,
}: {
	fs: NodeishFilesystem
	workspaceRoot: string | undefined
}): Promise<string | undefined> {
	try {
		const repoRoot = await findRepoRoot({
			nodeishFs: fs,
			path: workspaceRoot || "",
		})

		if (!repoRoot) {
			console.error("Failed to find repository root.")
			return
		}
		const repo = await openRepository(repoRoot, { nodeishFs: fs })
		return repo.getCurrentBranch()
	} catch (e) {
		return undefined
	}
}
