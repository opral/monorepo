import type { NodeishFilesystem } from "@lix-js/fs"

/**
 * Wraps a nodeishFs implementation with a js proxy for detailed logging, debugging and transparently replacing the file access behaviour.
 * advantage of using this approach is that the underlying fs can also be swapped to something like lightingfs seamlessly.
 */
type Args = {
	nodeishFs: NodeishFilesystem
	verbose?: boolean
	description?: string
	intercept?: (args: {
		prop: keyof NodeishFilesystem
		execute: () => any
		argumentsList: any[]
	}) => any
}

export const withProxy = ({
	nodeishFs,
	verbose = false,
	description,
	intercept,
}: Args): NodeishFilesystem => {
	return new Proxy(nodeishFs, {
		get(getTarget: typeof nodeishFs, prop, receiver) {
			if (getTarget[prop as keyof typeof nodeishFs]) {
				return new Proxy(getTarget[prop as keyof typeof getTarget], {
					apply(callTarget, thisArg, argumentsList) {
						if (verbose) {
							console.warn(`${description} fs:`, prop, argumentsList)
						}

						const execute = () => Reflect.apply(callTarget, thisArg, argumentsList)

						return intercept
							? intercept({ prop, argumentsList, execute } as {
									prop: keyof typeof nodeishFs
									execute: () => any
									argumentsList: any[]
							  })
							: execute()
					},
				})
			}

			return Reflect.get(getTarget, prop, receiver)
		},
	})
}

export function parseOrigin({ remotes }: { remotes?: any[] }): string | undefined {
	const origin = remotes?.find((elements: any) => elements.remote === "origin")
	if (origin === undefined) {
		return undefined
	}
	// polyfill for some editor related origin issues
	let result = origin.url
	if (result.endsWith(".git") === false) {
		result += ".git"
	}

	return transformRemote(result)
}

/**
 * Transforms a remote URL to a standard format.
 */
export function transformRemote(remote: string): string | undefined {
	// Match HTTPS pattern or SSH pattern
	const regex = /(?:https:\/\/|@|git:\/\/)([^/]+)\/(.+?)(?:\.git)?$/
	const matches = remote.match(regex)

	if (matches && matches[1] && matches[2]) {
		let host = matches[1].replace(/:/g, "/") // Replace colons with slashes in the host
		const repo = matches[2]

		// Remove ghp_ or ghs_ key if present in the host
		const hostRegex = /(ghp_|ghs_)[\w]+@/
		host = host.replace(hostRegex, "")

		return `${host}/${repo}.git`
	}
	return undefined
}

export function parseLixUri(uriText: string) {
	let url
	try {
		url = new URL(uriText)
	} catch (error) {
		// console.error(error, uriText) use only for debugging could leak secrets into logs
		return {
			error,

			username: "",
			password: "",
			protocol: "",
			lixHost: "",
			namespace: "",
			repoHost: "",
			owner: "",
			repoName: "",
		}
	}

	const { protocol, host, pathname, username, password } = url

	const pathParts = pathname.split("/")

	let lixHost = ""
	let namespace = ""
	let repoHost = ""
	let owner = ""
	let repoName = ""

	if (host === "github.com") {
		repoHost = host
		owner = pathParts[1] || ""
		repoName = pathParts[2] || ""

		if (!repoHost || !owner || !repoName) {
			return {
				error: new Error(
					`Invalid url format for '${uriText}' for direct cloning repository from github, please use the format of https://github.com/opral/monorepo.`
				),

				username,
				password,
				protocol,
				lixHost,
				namespace,
				repoHost,
				owner,
				repoName,
			}
		}
	} else {
		lixHost = host
		namespace = pathParts[1] || ""
		repoHost = pathParts[2] || ""
		owner = pathParts[3] || ""
		repoName = pathParts[4] || ""

		if (!namespace || !host || !owner || !repoName) {
			return {
				error: new Error(
					`Invalid url format for '${uriText}' for cloning repository, please use the format of https://lix.inlang.com/git/github.com/opral/monorepo.`
				),
				username,
				password,
				protocol,
				lixHost,
				namespace,
				repoHost,
				owner,
				repoName,
			}
		}
	}

	return {
		username,
		password,
		protocol,
		lixHost,
		namespace,
		repoHost,
		owner,
		repoName,
	}
}
