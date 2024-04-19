export function isExternal(url: URL, currentUrl: URL, base: string) {
	const absoluteBase = new URL(base ?? "/", currentUrl).pathname

	if (url.origin !== currentUrl.origin) {
		return true
	}

	if (!url.pathname.startsWith(absoluteBase)) {
		return true
	}

	return false
}
