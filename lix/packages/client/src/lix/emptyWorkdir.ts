import isoGit from "../../vendored/isomorphic-git/index.js"
import { statusList } from "../git/status-list.js"
import type { RepoState, RepoContext } from "../openRepository.js"

export async function emptyWorkdir(ctx: RepoContext, state: RepoState) {
	const { rawFs, cache } = ctx

	state.pending && (await state.pending)

	const statusResult = await statusList(ctx, state, { includeStatus: ["materialized", "ignored"] })

	const ignored: string[] = []
	const materialized: string[] = []
	const dirty: string[] = []
	for (const [path, status] of statusResult) {
		if (status === "unmodified") {
			materialized.push(path)
		} else if (status === "ignored") {
			ignored.push("/" + path)
		} else {
			dirty.push(path)
		}
	}

	if (dirty.length > 0) {
		console.error(dirty)
		throw new Error("could not empty the workdir, uncommitted changes")
	}

	const listing = await allFiles(rawFs, ignored)

	await Promise.all(
		listing.map((entry) =>
			rawFs
				.rm(entry)
				.catch((err) => {
					console.warn(err)
				})
				.then(() =>
					isoGit.remove({
						fs: rawFs,
						dir: "/",
						cache,
						filepath: entry,
					})
				)
		)
	)

	return materialized
}

async function allFiles(fs: any, ignored: string[], root = "/"): Promise<string[]> {
	const entries = await fs.readdir(root)

	const notIgnored = entries.filter((entry: string) => !ignored.includes(root + entry))

	const withMeta = await Promise.all(
		notIgnored.map(async (entry: string) => ({
			name: entry,
			isDir: (
				await fs.lstat(root + entry).catch((err: any) => {
					console.log(err)
				})
			)?.isDirectory?.(),
		}))
	)

	const withChildren = await Promise.all(
		withMeta.map(async ({ name, isDir }) =>
			isDir ? allFiles(fs, ignored, root + name + "/") : root + name
		)
	)

	return withChildren.flat().map((entry: string) => entry.replace(/^\//, ""))
}
