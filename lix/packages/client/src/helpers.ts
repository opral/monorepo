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

const rtf = new Intl.RelativeTimeFormat("en", {
	localeMatcher: "best fit",
	numeric: "always",
	style: "narrow",
})

export function formatTime(time: number, now = Date.now() / 1000) {
	const delta = Math.abs(time - now)

	const values = [
		delta / 31536000, // years
		(delta / 2592000) % 12, // months
		(delta / 604800) % 4, // weeks
		delta / 86400, // days
		(delta / 3600) % 24, // hours
		(delta / 60) % 60, // minutes
		delta % 60, // seconds
	]
	const units = ["year", "month", "week", "day", "hour", "minute", "second"]

	for (let i = 0; i < values.length; i++) {
		// @ts-ignore
		if (values[i] >= 1) {
			// @ts-expect-error
			return rtf.format(-values[i].toFixed(0), units[i])
		}
	}

	return "now"
}

// call first call immediately, always stays locked for delay time, if blocked calls: calls again after delay time, never misses a call that happens during lock, but requires indempotent functions (only does one call for all invocations during lock time)
export function throttle(fn: (...args: unknown[]) => unknown, delay: number = 1000) {
	let trailing = false
	let locked = false

	const throttled = async function (...args: unknown[]) {
		if (locked) {
			trailing = true
			return
		}

		locked = true
		const result = await fn(...args)

		setTimeout(() => {
			if (trailing) {
				locked = false
				trailing = false
				throttled(...args)
			} else {
				locked = false
			}
		}, delay)

		return result
	}

	return throttled
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

export async function hash(inputStr: string) {
	let usedCrypto
	// @ts-ignore
	if (typeof crypto === "undefined" && typeof process !== "undefined" && process?.versions?.node) {
		// Use string concatenation to force esbuild to treat module as external and not bundle it
		const modName = "crypto"
		usedCrypto = globalThis?.crypto || (await import(`node:${modName}`))
	} else if (typeof crypto !== "undefined") {
		usedCrypto = crypto
	}
	if (!usedCrypto) {
		throw new Error("Could not find crypto features in runtime")
	}

	const idDigest = await usedCrypto.subtle.digest("SHA-256", new TextEncoder().encode(inputStr))
	return [...new Uint8Array(idDigest)].map((b) => ("00" + b.toString(16)).slice(-2)).join("")
}
