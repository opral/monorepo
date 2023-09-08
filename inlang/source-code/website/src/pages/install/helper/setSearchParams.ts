/**
 * This helper function sets the search params in the url
 */
export const setSearchParams = (path: string) => {
	//get url from window
	const currentUrl = new URL(window.location.href)

	//put search params in new url
	const newUrl = new URL(currentUrl.protocol + "//" + currentUrl.host + path)

	window.location.href = newUrl.href
	window.history.pushState({}, "", newUrl)
}
