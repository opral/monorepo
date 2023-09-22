import { Octokit } from "octokit"

export const github = new Octokit({
	request: {
		fetch: (...ghArgs: any) => {
			ghArgs[0] = gitHubProxyBaseUrl + "/github-proxy/" + ghArgs[0]
			if (!ghArgs[1]) {
				ghArgs[1] = {}
			}

			if (gitHubProxyBaseUrl) {
				// required for authenticated cors requests
				ghArgs[1].credentials = "include"
			}

			// @ts-ignore
			return fetch(...ghArgs)
		},
	},
})
