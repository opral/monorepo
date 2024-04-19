import { Octokit } from "octokit"

export function makeGithubClient({ gitHubProxyUrl }: { gitHubProxyUrl?: string } = {}) {
	const githubClient = new Octokit({
		request: {
			fetch: (...ghArgs: any) => {
				ghArgs[0] = gitHubProxyUrl + "/" + ghArgs[0]
				if (!ghArgs[1]) {
					ghArgs[1] = {}
				}

				if (gitHubProxyUrl) {
					// required for authenticated cors requests
					ghArgs[1].credentials = "include"
				}

				// @ts-ignore
				return fetch(...ghArgs)
			},
		},
	})

	type getRepoType = (arg: {
		owner: string
		repoName: string
	}) => Promise<Record<string, any> | { error: Error }> // FIXME: ts sucks, waiting for bug  https://github.com/microsoft/TypeScript/issues/42873  Awaited<ReturnType<typeof githubClient.request<"GET /repos/{owner}/{repo}">>

	const getRepo: getRepoType = async ({ repoName, owner }) =>
		await githubClient
			.request("GET /repos/{owner}/{repo}", {
				owner,
				repo: repoName,
			})
			.catch((newError: Error) => {
				// setErrors((previous: any) => [...(previous || []), newError])
				// not throwing but returning error object allows simpler code and returning partial data from local clone if github not reachable in the future.
				return { error: newError }
			})

	type createForkType = (arg: { owner: string; repo: string }) => Promise<Record<string, any>>
	const createFork: createForkType = githubClient.rest.repos.createFork

	const mergeUpstream = async ({
		branch,
		owner,
		repoName,
	}: {
		branch: string
		owner: string
		repoName: string
	}): Promise<Record<string, any>> =>
		await githubClient.request("POST /repos/{owner}/{repo}/merge-upstream", {
			branch,
			owner,
			repo: repoName,
		})

	// const res: Promise<
	// 	| Awaited<
	// 			ReturnType<typeof githubClient.request<"GET /repos/{owner}/{repo}/compare/{base}...{head}">>
	// 	  >
	const compare = async ({
		owner,
		repoName,
		base,
		head,
	}: {
		owner: string
		repoName: string
		base: string
		head: string
	}): Promise<Record<string, any>> => {
		return await githubClient.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", {
			owner,
			repo: repoName,
			base,
			head,
		})
	}

	return {
		getRepo,
		createFork,
		mergeUpstream,
		compare,
	}
}
