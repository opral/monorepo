import type { Language } from "./sharedTypes.js"

type RootSlugDetector = ({
	url,
	availableLanguages,
}: {
	url: URL
	availableLanguages: Set<Language>
}) => Language | undefined

// TODO: make typescript require availableLanguages to have at least one entry. @ivanhofer is this possible?

export const rootSlugDetector = (({ url, availableLanguages }) =>
	[...availableLanguages].find((l) =>
		url.pathname.startsWith("/" + l + "/"),
	)) satisfies RootSlugDetector
