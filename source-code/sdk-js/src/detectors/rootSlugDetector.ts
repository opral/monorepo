import type { Language } from "./sharedTypes.js"

type RootSlugDetector = ({
	url,
	availableLanguages,
}: {
	url: URL
	availableLanguages: Set<Language>
}) => Language[]

export const rootSlugDetector = (({ url, availableLanguages }) =>
	[...availableLanguages].filter((l) => url.pathname.startsWith("/" + l)) ||
	[]) satisfies RootSlugDetector
