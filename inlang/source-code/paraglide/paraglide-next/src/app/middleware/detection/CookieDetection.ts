import { LanguageDetector } from "./interface"
import { LANG_COOKIE } from "../../constants"

export const createCookieDetection =
	<T extends string>(cfg: { availableLanguageTags: readonly T[] }): LanguageDetector<T> =>
	(request) => {
		const localeCookieValue = request.cookies.get(LANG_COOKIE.name)?.value
		if (cfg.availableLanguageTags.includes(localeCookieValue as T)) return localeCookieValue as T
		else return undefined
	}
