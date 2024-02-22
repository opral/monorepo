import { createLink } from "./Link.base"
import { getLanguage } from "./getLanguage.server"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"
import { createNavigation } from "./navigation.base"

export type I18nOptions = {
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
}

export function createI18n(options: I18nOptions = {}) {
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
	const { usePathname, useRouter, redirect, permanentRedirect } = createNavigation(
		getLanguage,
		strategy
	)

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
