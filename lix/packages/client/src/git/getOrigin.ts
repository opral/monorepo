import { parseOrigin } from "../helpers.js"
import { listRemotes } from "./listRemotes.js"
import type { RepoContext, RepoState } from "../openRepository.js"

/**
 * Parses the origin from remotes.
 *
 * The function ensures that the same orgin is always returned for the same repository.
 */
export async function getOrigin(ctx: RepoContext, state: RepoState): Promise<string | undefined> {
	const remotes: Array<{ remote: string; url: string }> | undefined =
		(await listRemotes(ctx, state)) || []

	return await parseOrigin({ remotes })
}
