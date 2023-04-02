import type { Language } from "./sharedTypes.js"
import { acceptLanguageHeaderDetector } from "./acceptLanguageHeaderDetector.js"
import { rootSlugDetector } from "./rootSlugDetector.js"
import { navigatorDetector } from "./navigatorDetector.js"
import { matchLang } from "./matchLang.js"

type AcceptLanguageStrategy = [
	"accept-language-header",
	Parameters<typeof acceptLanguageHeaderDetector>,
]
type DetectionStrategy = "root-slug" | AcceptLanguageStrategy | "navigator"
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

const detectWithStrategy = ((params) => {
	const { strategy, detectorParams } = params
	if (strategy === "navigator") {
		return navigatorDetector(...detectorParams)
	} else if (strategy === "root-slug") {
		return rootSlugDetector(...detectorParams)
	} else if (strategy === "accept-language-header") {
		return acceptLanguageHeaderDetector(...detectorParams)
	}
	return []
}) satisfies DetectWithStrategy

/**
 * Takes an array of detection strategies and returns
 *
 * @param params Function parameters
 * @param params.strategies A Set of detection strategies ordered by precedence (preferred first) (as JS Sets preserve insertion order)
 * @param params.fallbackLanguage The language to fallback to if there is no detection match
 * @param params.availableLanguages Set of languages that are available for detection
 * @return The detected language
 */
const detectLanguage = ({
	strategies = new Set(["navigator", "root-slug"]),
	fallbackLanguage,
	availableLanguages,
}: {
	strategies?: Set<DetectionStrategy>
	fallbackLanguage: Language
	availableLanguages: Set<Language>
}): Language => {
	const strategiesWithData = [...strategies].map((s) => {
		if (s === "root-slug") {
			return {
				strategy: s,
				detectorParams: [{ url: new URL(window.location.href), availableLanguages }],
			}
		} else if (s === "navigator") {
			return { strategy: s, detectorParams: [{ window }] }
		} else {
			return { strategy: "accept-language-header", detectorParams: s[1] }
		}
	}) satisfies Parameters<DetectWithStrategy>[0][]
	const detected = strategiesWithData.flatMap((swd) => detectWithStrategy(swd))
	return matchLang(detected, availableLanguages) ?? fallbackLanguage
}

export default detectLanguage
