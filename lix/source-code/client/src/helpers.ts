import type { NodeishFilesystem } from "@lix-js/fs"

/**
 * Wraps a nodeishFs implementation with a js proxy for detailed logging, debugging and transparently replacing the file access behaviour.
 * advantage of using this approach is that the underlying fs can also be swapped to something like lightingfs seamlessly.
 */
export const withLazyFetching = (
	targetRoot: NodeishFilesystem,
	_module: string,
	fn?: (args: { prop: keyof typeof targetRoot; execute: () => any }) => any
): NodeishFilesystem => {
	return new Proxy(targetRoot, {
		get(getTarget: typeof targetRoot, prop, receiver) {
			if (getTarget[prop as keyof typeof targetRoot]) {
				return new Proxy(getTarget[prop as keyof typeof getTarget], {
					apply(callTarget, thisArg, argumentsList) {
						// console.verbose(`${_module} fs:`, prop, argumentsList)

						const execute = () => Reflect.apply(callTarget, thisArg, argumentsList)

						return fn
							? fn({ prop, execute } as { prop: keyof typeof targetRoot; execute: () => any })
							: execute()
					},
				})
			}

			return Reflect.get(getTarget, prop, receiver)
		},
	})
}

/**
 * Transforms a remote URL to a standard format.
 */
export function transformRemote(remote: string) {
	// Match HTTPS pattern or SSH pattern
	const regex = /(?:https:\/\/|@|git:\/\/)([^/]+)\/(.+?)(?:\.git)?$/
	const matches = remote.match(regex)

	if (matches && matches[1] && matches[2]) {
		let host = matches[1].replace(/:/g, "/") // Replace colons with slashes in the host
		const repo = matches[2]

		// Remove ghp_ key if present in the host
		host = host.replace(/ghp_[\w]+@/, "")

		return `${host}/${repo}.git`
	}
	return "unknown" // Return unchanged if no match
}

export function parseLixUri(uriText: string) {
	const { protocol, host, pathname } = new URL(uriText)

	if (protocol === "file:") {
		throw new Error(`Local repos are not supported yet`)
	}

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
			throw new Error(
				`Invalid url format for '${uriText}' for direct cloning repository from github, please use the format of https://github.com/inlang/monorepo.`
			)
		}
	} else {
		lixHost = host
		namespace = pathParts[1] || ""
		repoHost = pathParts[2] || ""
		owner = pathParts[3] || ""
		repoName = pathParts[4] || ""

		if (!namespace || !host || !owner || !repoName) {
			throw new Error(
				`Invalid url format for '${uriText}' for cloning repository, please use the format of https://lix.inlang.com/git/github.com/inlang/monorepo.`
			)
		}
	}

	return {
		protocol,
		lixHost,
		namespace,
		repoHost,
		owner,
		repoName,
	}
}
