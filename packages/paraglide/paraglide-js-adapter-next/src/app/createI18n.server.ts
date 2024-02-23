import { createLink } from "./Link.base"
import { getLanguage } from "./getLanguage.server"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"
import { createNavigation, createRedirects } from "./navigation.base"

export type I18nOptions<T extends string> = {
	/**
	 * A list of patterns that should not be localized.
	 *
	 * @example
	 * ```ts
	 * exclude: [/^\/api\//] // Exclude `/api/*` from localization
	 * ```
	 *
	 * @default []
	 */
	exclude?: (string | RegExp)[]

	/**
	 * The default language to use when no language is set.
	 *
	 * @default sourceLanguageTag
	 */
	defaultLanguage?: T

	/**
	 * A map of text-directions for each language.
	 */
	textDirection?: Record<T, "ltr" | "rtl">
}

export function createI18n(options: I18nOptions<string> = {}) {
	const strategy = prefixStrategy({
		availableLanguageTags,
		sourceLanguageTag,
		exclude: normalizeExcludes(options.exclude ?? []),
	})

	/**
	 * React Component that enables client-side transitions between routes.
	 *
	 * Automatically localises the href based on the current language.
	 */
	const Link = createLink(getLanguage, strategy)
	const { usePathname, useRouter } = createNavigation(getLanguage, strategy)
	const { redirect, permanentRedirect } = createRedirects(getLanguage, strategy)

	return {
		Link,
		usePathname,
		useRouter,
		redirect,
		permanentRedirect,
	}
}

function normalizeExcludes(excludes: (string | RegExp)[]): RegExp[] {
	return excludes.map((exclude) => {
		if (typeof exclude === "string") {
			return new RegExp(`^${exclude}$`)
		}
		return exclude
	})
}
