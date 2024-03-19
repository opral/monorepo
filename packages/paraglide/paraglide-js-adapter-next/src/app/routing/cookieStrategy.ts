import { isAvailableLanguageTag } from "$paraglide/runtime.js"
import { ResolvedI18nConfig } from "../config"
import { LANG_COOKIE } from "../constants"
import { RoutingStragey } from "./interface"

export function CookieStrategy<T extends string>(config: ResolvedI18nConfig<T>): RoutingStragey<T> {
	return {
		resolveLanguage(request) {
			const cookieValue = request.cookies.get(LANG_COOKIE.name)?.value
			return isAvailableLanguageTag(cookieValue) ? (cookieValue as T) : config.defaultLanguage
		},

		getLocalisedPath(canonicalPath) {
			return canonicalPath
		},

		getCanonicalPath(localisedPath) {
			return localisedPath
		},

		translatePath: (localisedPath) => {
			return localisedPath
		},
	}
}
