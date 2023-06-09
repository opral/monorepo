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
	const regex = /(?:https:\/\/|@)([^/]+)\/(.+?)(?:\.git)?$/
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
