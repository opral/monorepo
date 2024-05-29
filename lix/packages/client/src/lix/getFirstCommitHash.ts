import type { RepoContext } from "../openRepository.js"
import { makeHttpClient } from "../git-http/client.js"
import isoGit from "../../vendored/isomorphic-git/index.js"

export async function getFirstCommitHash(ctx: RepoContext) {
	const getFirstCommitFs = ctx.rawFs

	const maybeShallow = !!(await getFirstCommitFs
		.readFile(ctx.dir + "/.git/shallow", { encoding: "utf-8" })
		.catch(() => undefined))

	if (maybeShallow) {
		console.warn("shallow clone detected, not generating first commit hash.")
		return undefined
	}

	if (ctx.useLazyFS) {
		try {
			await isoGit.fetch({
				singleBranch: true,
				dir: ctx.dir,
				depth: 2147483647, // the magic number for all commits
				http: makeHttpClient({ debug: ctx.debug, description: "getFirstCommitHash" }),
				corsProxy: ctx.gitProxyUrl,
				fs: getFirstCommitFs,
			})
		} catch {
			return undefined
		}
	}

	let firstCommitHash: string | undefined = "HEAD"
	for (;;) {
		// FIXME: detect shallow clone and fetch more commits
		const commits: Awaited<ReturnType<typeof isoGit.log>> | { error: any } = await isoGit
			.log({
				fs: getFirstCommitFs,
				depth: 550,
				dir: ctx.dir,
				ref: firstCommitHash,
			})
			.catch((error: any) => {
				return { error }
			})

		if ("error" in commits) {
			firstCommitHash = undefined
			break
		}

		const lastHashInPage: undefined | string = commits.at(-1)?.oid
		if (lastHashInPage) {
			firstCommitHash = lastHashInPage
		}

		if (commits.length < 550) {
			break
		}
	}

	return firstCommitHash
}
