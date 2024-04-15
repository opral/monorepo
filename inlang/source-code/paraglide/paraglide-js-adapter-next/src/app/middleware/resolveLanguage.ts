import { NextRequest } from "next/server"
import { RoutingStragey } from "../routing/interface"
import { ResolvedI18nConfig } from "../config"
import { ACCEPT_LANGUAGE_HEADER_NAME, LANG_COOKIE } from "../constants"
import { isAvailableLanguageTag } from "$paraglide/runtime.js"
import { negotiateLanguagePreferences } from "@inlang/paraglide-js/internal/adapter-utils"

/**
 * Returns the language that should be used for this request
 *
 *  1. User-Configured resolveLanuage (may be undefined)
 *  2. NEXT_LOCALE Cookie (may be undefined)
 *  3. Negotiate Language (with default as fallback)
 *
 * @param nextRequst
 * @param strategy
 */
export function resolveLanguage<T extends string>(
	request: NextRequest,
	config: ResolvedI18nConfig<T>,
	strategy: RoutingStragey<T>
): T {
	const locale = strategy.resolveLanguage(request)
	if (locale) return locale

	const localeCookeValue = request.cookies.get(LANG_COOKIE.name)?.value
	if (isAvailableLanguageTag(localeCookeValue)) return localeCookeValue as T

	const acceptLanguage = request.headers.get(ACCEPT_LANGUAGE_HEADER_NAME)
	const preferences = negotiateLanguagePreferences(acceptLanguage, config.availableLanguageTags)
	return preferences[0] ?? config.defaultLanguage
}
