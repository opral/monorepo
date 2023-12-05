import dedent from "dedent"
import { GET_LANGUAGE_MODULE_ID, TRANSLATE_PATH_MODULE_ID } from "../constants.js"

export function getPublicModuleCode(): string {
	return dedent`
        import translatePath from "${TRANSLATE_PATH_MODULE_ID}"
        import getLanguage from "${GET_LANGUAGE_MODULE_ID}"

        export { translatePath, getLanguage };
    `
}
