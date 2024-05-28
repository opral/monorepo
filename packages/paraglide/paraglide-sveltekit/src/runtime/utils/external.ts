export function isExternal(url: URL, currentUrl: URL, base: string) {
	const absoluteBase = new URL(base ?? "/", currentUrl).pathname
	return url.origin !== currentUrl.origin || !url.pathname.startsWith(absoluteBase)
}
