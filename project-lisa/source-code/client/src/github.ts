import { Octokit } from "octokit"

/**
 * The path used for proxy purposes.
 *
 * The server will proxy all requests to this path to the github API.
 */
export const PATH = "/github-proxy/"

/**
 * The github client.
 *
 * Wrapper around octokit, the gihub API client for Javascript,
 * with a proxied fetch function.
 *
 * API reference https://octokit.github.io/rest.js
 */
export const github = new Octokit({
	request: {
		fetch: (...args: any) => {
			// modify the path to be proxied by the server
			args[0] = PATH + args[0]
			// @ts-ignore
			return fetch(...args)
		},
	},
})
