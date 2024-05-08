import { LanguageDetector } from "./interface"
import { LANG_COOKIE } from "../../constants"

export const createCookieDetection =
	<T extends string>(cfg: { availableLanguageTags: readonly T[] }): LanguageDetector<T> =>
	(request) => {
		const localeCookeValue = request.cookies.get(LANG_COOKIE.name)?.value
		if (cfg.availableLanguageTags.includes(localeCookeValue as T)) return localeCookeValue as T
		else return undefined
	}
