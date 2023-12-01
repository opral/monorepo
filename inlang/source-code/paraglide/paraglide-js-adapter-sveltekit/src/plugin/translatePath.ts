import { OUTDIR_ALIAS, TRANSLATE_PATH_FUNCTION_NAME } from "../constants.js"
import dedent from "dedent"

export function getTranslatePathModuleCode(): string {
	return prefixStrategy({ prefixDefault: true })
}


function domainStrategy({ domains }: { domains: Record<string, string> }): string {
	return dedent`
    import { sourceLanguageTag, availableLanguageTags } from "${OUTDIR_ALIAS}/runtime.js"

    const domains = ${JSON.stringify(domains)}

    /**
     * Takes in a path without language information and
     * returns a path with language information.
     * 
     * @param {string} path
     * @param {string} lang
     * @returns {string}
     */
    export function ${TRANSLATE_PATH_FUNCTION_NAME}(path, lang) {
        // ignore external links & relative paths
        if (!path.startsWith("/")) return path

        path = getPathWithoutLang(path)

        return domains[lang] + path
    }

    /**
     * Removes the language tag from the path, if it exists.
     * @param {string} path
     */
    function getPathWithoutLang(path) {
        const [maybeLang, ...rest] = path.split(".")
        if (availableLanguageTags.includes(maybeLang)) return rest.join(".")
        else return path
    }
    `
}


function prefixStrategy({ prefixDefault }: { prefixDefault: boolean }): string {
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
    export function ${TRANSLATE_PATH_FUNCTION_NAME}(path, lang) {
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

function alwaysPrefix(): string {
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
    export function ${TRANSLATE_PATH_FUNCTION_NAME}(path, lang) {
        // ignore external links & relative paths
        if (!path.startsWith("/")) return path 

        path = getPathWithoutLang(path)

        //Otherwise, prefix with the language tag
        else return "/" + lang + path
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
