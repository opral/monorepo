import { OUTDIR_ALIAS } from "../../constants.js"
import type { RoutingStrategyConfig } from "./strategy.js"
import dedent from "dedent"

export function getGetLanguageModuleCode(strategy: RoutingStrategyConfig): string {
	switch (strategy.name) {
		case "domain":
			return domainStrategy(strategy)
		case "prefix":
			return prefixStrategy(strategy)
		case "searchParam":
			return searchParamStrategy(strategy)
	}
}

function domainStrategy(strategy: Extract<RoutingStrategyConfig, { name: "domain" }>): string {
	const langToHostname = strategy.domains

	const hostnameToLang = Object.fromEntries(
		Object.entries(langToHostname).map(([lang, domain]) => [domain, lang])
	)

	return dedent`
        import { sourceLanguageTag, availableLanguageTags } from "${OUTDIR_ALIAS}/runtime.js"

        /**
         * Maps hostnames to their language tag
         * @type {Record<string, string>}
         */
        const hostnames = ${JSON.stringify(hostnameToLang)}

        /**
         * Takes in a url and returns the language tag that is used in the url.
         * If the url does not contain a language tag, the source language tag is returned.
         * @param {URL} url
         * @returns {string}
         */
        export default function getLanguage(url) {
            return hostnames[url.hostname] ?? sourceLanguageTag;
        }
        `
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function prefixStrategy(strategy: Extract<RoutingStrategyConfig, { name: "prefix" }>): string {
	return dedent`
        import { sourceLanguageTag, availableLanguageTags, isAvailableLanguageTag } from "${OUTDIR_ALIAS}/runtime.js"

        /**
         * Takes in a url and returns the language tag that is used in the url.
         * If the url does not contain a language tag, the source language tag is returned.
         * It is assumed that the URL is not external.
         * 
         * @param {URL} url
         * @returns {string}
         */
        export default function getLanguage(url) {
            const maybeLanguageTag = url.pathname.split("/")[1];
            return isAvailableLanguageTag(maybeLanguageTag)
                ? maybeLanguageTag 
                : sourceLanguageTag;
        }
        `
}

function searchParamStrategy(
	strategy: Extract<RoutingStrategyConfig, { name: "searchParam" }>
): string {
	return dedent`
        import { sourceLanguageTag, availableLanguageTags, isAvailableLanguageTag } from "${OUTDIR_ALIAS}/runtime.js"

        /**
         * Takes in a url and returns the language tag that is used in the url.
         * If the url does not contain a language tag, the source language tag is returned.
         * It is assumed that the URL is not external.
         * 
         * @param {URL} url
         * @returns {string}
         */
        export default function getLanguage(url) {
                const maybeLanguageTag = url.searchParams.get("${
									strategy.searchParamName ?? "lang"
								}");
                return isAvailableLanguageTag(maybeLanguageTag)
                        ? maybeLanguageTag
                        : sourceLanguageTag;
        }
        `
}
