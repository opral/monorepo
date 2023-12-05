import { PARAGLIDE_RUNTIME_MODULE_ALIAS } from "../../constants.js"
import type { RoutingStrategyConfig } from "./config.js"
import dedent from "dedent"

export function getTranslatePathModuleCode(
	strategy: RoutingStrategyConfig,
	excludeRegexes: RegExp[],
): string {
	switch (strategy.name) {
		case "domain":
			return domainStrategy(strategy, excludeRegexes)
		case "prefix":
			return prefixStrategy(strategy, excludeRegexes)

		case "searchParam":
			return searchParamStrategy(strategy, excludeRegexes)
	}
}

function domainStrategy(
	{ domains }: Extract<RoutingStrategyConfig, { name: "domain" }>,
	excludeRegexes: RegExp[],
): string {
	return dedent`
    import { sourceLanguageTag, availableLanguageTags, languageTag } from "${PARAGLIDE_RUNTIME_MODULE_ALIAS}"

    /**
     * Maps language tags to their domain
     * @type {Record<string, string>}
     */
    const domains = ${JSON.stringify(domains)}
    
    /** If the path matches any of these regexes, it will be _not_ translated */
    const excludeRegexes = [${excludeRegexes.map((r) => `/${r.source}/`).join(", ")}];

    /**
     * Takes in a path without language information and
     * returns a path with language information.
     *
     * @param {string} path
     * @param {string} lang
     * @returns {string}
     */
    export default function translatePath(path, lang) {
        // ignore external links & relative paths
        if (!path.startsWith("/")) return path


        //If the path matches any of the exclude regexes, return it as is
        if (excludeRegexes.some((r) => r.test(path))) return path

        //If the path keeps the language, return it as is
        if(lang === languageTag()) return path

        const domain = domains[lang]
        if (!domain) return path
        
        //absolute paths can always be prefixed with the domain
        // the "//" prefix tells the browser to use the current protocol (http or https)
        return "//" + domain + path
    }
    `
}

function prefixStrategy(
	{ prefixDefault }: Extract<RoutingStrategyConfig, { name: "prefix" }>,
	excludeRegexes: RegExp[],
): string {
	return dedent`
    import { sourceLanguageTag, availableLanguageTags } from "${PARAGLIDE_RUNTIME_MODULE_ALIAS}"

    /** If the path matches any of these regexes, it will be _not_ translated */
    const excludeRegexes = [${excludeRegexes.map((r) => `/${r.source}/`).join(", ")}];

    /**
     * Takes in a path without language information and
     * returns a path with language information.
     * 
     * @param {string} path
     * @param {string} lang
     * @returns {string}
     */
    export default function translatePath(path, lang) {
        // ignore external links & relative paths
        if (!path.startsWith("/")) return path 

        path = getPathWithoutLang(path)


        //If the path matches any of the exclude regexes, return it as is
        if (excludeRegexes.some((r) => r.test(path))) return path

        ${
					prefixDefault
						? ""
						: dedent`
                        //Don't prefix with the source language tag, that's the default
                        if (lang === sourceLanguageTag) return path
                        `
				}

        //return the path with the language tag
        return "/" + lang + path
    }

    /**
     * Removes the language tag from the path, if it exists.
     * @param {string} path
     */
    function getPathWithoutLang(path) {
        const [_, maybeLang, ...rest] = path.split("/")
        if (availableLanguageTags.includes(maybeLang)) return "/" + rest.join("/")
        else return path
    }
    `
}

function searchParamStrategy(
	strategy: Extract<RoutingStrategyConfig, { name: "searchParam" }>,
	excludeRegexes: RegExp[],
): string {
	const searchParamName = strategy.searchParamName

	return dedent`
        import { sourceLanguageTag, availableLanguageTags } from "${PARAGLIDE_RUNTIME_MODULE_ALIAS}"

        /** If the path matches any of these regexes, it will be _not_ translated */
        const excludeRegexes = [${excludeRegexes.map((r) => `/${r.source}/`).join(", ")}];


        export default function translatePath(path, lang) {
            // ignore external links & relative paths
            if (!path.startsWith("/")) return path 


            //If the path matches any of the exclude regexes, return it as is
            if (excludeRegexes.some((r) => r.test(path))) return path

            const [_, search] = path.split("?")

            if(!search) return path + "?" + "${searchParamName}" + "=" + lang;

            const searchParams = new URLSearchParams(search)
            searchParams.set("${searchParamName}", lang)

            return path + "?" + searchParams.toString()
        }
    `
}
