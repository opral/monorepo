// set search params

type SearchParams = {
	search?: string
	lint?: `${string}.${string}`[]
	lang?: string[]
}

type SearchType = {
	key: "search"
	value: string
}
type LintType = {
	key: "lint"
	value: `${string}.${string}`[]
}
type LangType = {
	key: "lang"
	value: string[]
}

type SearchParamsType = SearchType | LintType | LangType

export const setSearchParams = ({ key, value }: SearchParamsType) => {
	//get url from window
	const currentUrl = new URL(window.location.href)

	//extract search params from url
	const searchParamsObj: SearchParams = {
		search: currentUrl.searchParams.get("search") || "",
		lint: currentUrl.searchParams.getAll("lint") as `${string}.${string}`[],
		lang: currentUrl.searchParams.getAll("lang"),
	}

	//set search params in object
	switch (key) {
		case "search":
			searchParamsObj.search = value as string
			break
		case "lint":
			searchParamsObj.lint = []
			searchParamsObj.lint = [...value]
			break
		case "lang":
			searchParamsObj.lang = []
			searchParamsObj.lang = [...value]
			break
	}

	//put search params in new url
	const newUrl = new URL(location.protocol + "//" + location.host + location.pathname)
	const currentParams = newUrl.searchParams
	for (const [key, value] of Object.entries(searchParamsObj)) {
		if (typeof value === "string") {
			// for search
			if (value && value !== "") {
				currentParams.append(key, value as string)
			}
		} else {
			// for lint and lang
			if (value.length > 0) {
				value.map((val) => {
					currentParams.append(key, val as string)
				})
			}
		}
	}

	newUrl.search = currentParams.toString()
	window.history.pushState({}, "", newUrl)
}
