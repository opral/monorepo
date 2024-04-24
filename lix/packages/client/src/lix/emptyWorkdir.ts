import isoGit from "../../vendored/isomorphic-git/index.js"
import { statusList } from "../git/status-list.js"
import type { RepoState, RepoContext } from "../openRepository.js"

export async function emptyWorkdir(ctx: RepoContext, state: RepoState) {
	const { rawFs, cache, dir } = ctx
	const { checkedOut } = state

	const statusResult = await statusList(ctx, state)
	if (statusResult.length > 0) {
		throw new Error("could not empty the workdir, uncommitted changes")
	}

	const listing = (await rawFs.readdir("/")).filter((entry) => {
		return !checkedOut.has(entry) && entry !== ".git"
	})

	const notIgnored = (
		await Promise.all(
			listing.map((entry) =>
				isoGit.isIgnored({ fs: rawFs, dir, filepath: entry }).then((ignored) => {
					return { ignored, entry }
				})
			)
		)
	)
		.filter(({ ignored }) => !ignored)
		.map(({ entry }) => entry)

	for (const toDelete of notIgnored) {
		await rawFs.rm(toDelete, { recursive: true }).catch(() => {})

		// remove it from isoGit's index as well
		await isoGit.remove({
			fs: rawFs,
			// ref: args.branch,
			dir: "/",
			cache,
			filepath: toDelete,
		})
	}
}
