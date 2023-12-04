import { OUTDIR_ALIAS } from "../constants.js"
import dedent from "dedent"

export type RoutingStrategyConfig =
	| {
			name: "prefix"

			/**
			 * If the default language should be prefixed with the language tag.
			 * If false, the default language will start at `/` instead of `/{lang}/`
			 */
			prefixDefault: boolean
	  }
	| {
			name: "domain"

			/**
			 * Map each language tag to its domain.
			 */
			domains: Record<string, string>
	  }

export function getTranslatePathModuleCode(strategy: RoutingStrategyConfig): string {
	switch (strategy.name) {
		case "domain":
			return domainStrategy(strategy)
		case "prefix":
			return prefixStrategy(strategy)
	}
}

function domainStrategy({ domains }: Extract<RoutingStrategyConfig, { name: "domain" }>): string {
	return dedent`
    import { sourceLanguageTag, availableLanguageTags, languageTag } from "${OUTDIR_ALIAS}/runtime.js"

    /**
     * Maps language tags to their domain
     * @type {Record<string, string>}
     */
    const domains = ${JSON.stringify(domains)}

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

        //If the path keeps the language, return it as is
        if(lang === languageTag()) return path

        const domain = domains[lang]
        if (!domain) return path
        
        //absolute paths can always be prefixed with the domain
        return domain + path
    }
    `
}

function prefixStrategy({
	prefixDefault,
}: Extract<RoutingStrategyConfig, { name: "prefix" }>): string {
	return dedent`
    import { sourceLanguageTag, availableLanguageTags } from "${OUTDIR_ALIAS}/runtime.js"

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
