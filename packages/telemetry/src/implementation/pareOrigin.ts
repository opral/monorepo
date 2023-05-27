export function parseOrigin(args: { remotes: Array<{ remote: string; url: string }> | undefined }) {
	// export function parseOrigin(args: { remotes: Array<object> | undefined }) {
	//Notes
	// also possible
	// export function parseOrigin(args: { remotes: [] }) {
	//export function parseOrigin(args: { remotes: { remote: string; url: string }[] | undefined }) {
	if (args.remotes === undefined || args.remotes.length === 0) {
		return "unknown"
	}
	const origin: any = args.remotes.find((elements) => elements.remote === "origin")
	// Im aware that any is not correct, but I don't know, how I cover all cases?
	if (origin === undefined) {
		return "unknown"
	} else if (origin.url.startsWith("https://") && origin.url.endsWith(".git")) {
		return origin.url
	} else if (origin.url.startsWith("https://")) {
		return origin.url + ".git"
	} else {
		return "unknown"
	}
}
