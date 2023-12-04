import dedent from "dedent"
import { OUTDIR_ALIAS, TRANSLATE_PATH_MODULE_ID } from "../constants.js"

export function getPublicModuleCode(): string {
	return dedent`
        import translatePath from "${TRANSLATE_PATH_MODULE_ID}"
        import { languageTag } from "${OUTDIR_ALIAS}/runtime.js"
        import { goto as sk_goto } from "$app/navigation"

        /**
         * A wrapper around SvelteKit's goto function that translates the path before navigating.
         * @param {string | URL} url
         * @param {any} options
         * @returns Promise<any>
         */
        function goto(url, options) {
            //Bail if the url is not a string
            if(typeof url !== "string") return sk_goto(url, options);

            //Get the language tag that should be used
            const language = options?.language ?? languageTag();

            //Translate the path
            const translatedPath = translatePath(path, language);

            //Navigate to the translated path
            return sk_goto(translatedPath, options);
        }

        export { translatePath, goto };
    `
}
