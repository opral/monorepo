/**
 * This helper function sets the search params in the url
 */
export const setSearchParams = (searchValue: string) => {
	//get url from window
	const currentUrl = new URL(window.location.href)

	if (searchValue === "") {
		const newUrl = new URL(currentUrl.protocol + "//" + currentUrl.host)
		window.history.pushState({}, "", newUrl)
		return
	}

	//put search params in new url
	const newUrl = new URL(currentUrl.protocol + "//" + currentUrl.host + searchValue)

	window.location.href = newUrl.href
	window.history.pushState({}, "", newUrl)
}
