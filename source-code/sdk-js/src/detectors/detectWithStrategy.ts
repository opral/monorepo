import { rootSlugDetector } from "./rootSlugDetector.js"
import { navigatorDetector } from "./navigatorDetector.js"
import { acceptLanguageHeaderDetector } from "./acceptLanguageHeaderDetector.js"
import type { Language } from "./sharedTypes.js"

type DetectWithStrategyParams =
	| {
			strategy: "accept-language-header"
			detectorParams: Parameters<typeof acceptLanguageHeaderDetector>
	  }
	| {
			strategy: "root-slug"
			detectorParams: Parameters<typeof rootSlugDetector>
	  }
	| {
			strategy: "navigator"
			detectorParams: Parameters<typeof navigatorDetector>
	  }

type DetectWithStrategy = (
	{ strategy, detectorParams }: DetectWithStrategyParams,
	availableLanguages: Set<Language>,
) => Language[]

export const detectWithStrategy = ((params) => {
	const { strategy, detectorParams } = params
	switch (strategy) {
		case "navigator":
			return navigatorDetector(...detectorParams)
		case "root-slug": {
			const detector = rootSlugDetector(...detectorParams)
			return detector !== undefined ? [detector] : []
		}
		case "accept-language-header": {
			return acceptLanguageHeaderDetector(...detectorParams)
		}
	}
}) satisfies DetectWithStrategy
