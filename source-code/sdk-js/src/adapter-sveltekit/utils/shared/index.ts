export const inlangSymbol = Symbol.for("inlang")

export const setInlangPayload = <P>(payload: P) => ({ [inlangSymbol]: payload })

export const getInlangPayload = <P>(data: { [inlangSymbol]: P }) => data[inlangSymbol]

// ------------------------------------------------------------------------------------------------

export type RelativeUrl = `/${string}`

// ------------------------------------------------------------------------------------------------

export const replaceLanguageInUrl = (url: URL, language: string) =>
	new URL(
		`${url.origin}${replaceLanguageInSlug(url.pathname as RelativeUrl, language)}${url.search}${url.hash
		}`,
	)

const replaceLanguageInSlug = (pathname: RelativeUrl, language: string) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, __, ...path] = pathname.split("/")
	return `/${language}/${path.join("/")}`
}