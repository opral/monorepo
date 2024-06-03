import { LanguageDetector } from "./interface"
import { LANG_COOKIE_NAME } from "../../constants"

export const createCookieDetection =
	<T extends string>(cfg: { availableLanguageTags: readonly T[] }): LanguageDetector<T> =>
	(request) => {
		const localeCookieValue = request.cookies.get(LANG_COOKIE_NAME)?.value
		if (cfg.availableLanguageTags.includes(localeCookieValue as T)) return localeCookieValue as T
		else return undefined
	}
