import { findRoot, listRemotes } from "isomorphic-git"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs"

// TODO: move to lix api when local repos supported
/**
 * Gets the git origin url of the current repository.
 *
 * @params args.filepath filepath override for injecting non cwd path for testing
 * @params args.nodeishFs fs implementation override for injecting virtual fs for testing
 * @returns The git origin url or undefined if it could not be found.
 */
export async function getGitRemotes(
	args: { filepath?: string; nodeishFs?: NodeishFilesystem } = {}
) {
	try {
		const usedFs = args.nodeishFs || fs
		const root = await findRoot({ fs: usedFs, filepath: args.filepath || process.cwd() })

		const remotes = await listRemotes({
			fs: usedFs,
			dir: root,
		})
		return remotes
	} catch (e) {
		return undefined
	}
}


/**
 * Parses the origin from the remotes.
 *
 * The function ensures that the same orgin is always returned for the same repository.
 */
export function parseOrigin(args: {
	remotes: Array<{ remote: string; url: string }> | undefined
}): string {
	const origin = args.remotes?.find((elements) => elements.remote === "origin")
	if (origin === undefined) {
		return "unknown"
	}
	// polyfill for some editor related origin issues
	let result = origin.url
	if (result.endsWith(".git") === false) {
		result += ".git"
	}
	result = transformRemote(result)

	return result
}

/**
 * Transforms a remote URL to a standard format.
 */
function transformRemote(remote: string) {
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
