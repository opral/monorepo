export function isExternal(url: URL, currentUrl: URL, base: string) {
	if (url.origin !== currentUrl.origin) {
		return true
	}
	if (!url.pathname.startsWith(base)) {
		return true
	}

	return false
}
