/*

Paraglide — SolidStart Adapter

This file will in the future be a npm package.
Right now you can copy it into your project.
And use it like this: (see ./index.tsx)

*/

import * as solid from "solid-js"
import * as solid_web from "solid-js/web"
import * as router from "@solidjs/router"

/**
 * Normalize a pathname.
 * (e.g. "/foo" → "/foo")
 * (e.g. "foo" → "/foo")
 */
export function normalizePathname(pathname: string): string {
	return pathname[0] === "/" ? pathname : "/" + pathname
}

/**
 * Get the language tag from the URL.
 *
 * @param pathname The pathname to check. (e.g. "/en/foo") (use {@link normalizePathname} first)
 * @param all_language_tags All available language tags. (From paraglide, e.g. "en", "de")
 * @returns The language tag from the URL, or `undefined` if no language tag was found.
 */
export function languageTagInPathname<T extends string>(
	pathname: string,
	all_language_tags: readonly T[]
): T | undefined {
	for (const tag of all_language_tags) {
		if (pathname.startsWith(`/${tag}/`)) {
			return tag
		}
	}
}

/**
 * Get the language tag from the URL, using `router.useLocation()`. (needs to be used under `router.Router` context)
 *
 * @param all_language_tags All available language tags. (From paraglide, e.g. "en", "de")
 * @returns The language tag from the URL, or `undefined` if no language tag was found.
 */
export function getLanguageTagFromURL<T extends string>(
	all_language_tags: readonly T[]
): T | undefined {
	const location = router.useLocation()
	const normalized_pathname = normalizePathname(location.pathname)
	return languageTagInPathname(normalized_pathname, all_language_tags)
}

/**
 * The compiled paraglide runtime module.
 * (e.g. "paraglide/runtime.js")
 */
export interface Paraglide<T extends string> {
	readonly setLanguageTag: (language_tag: T | (() => T)) => void
	readonly languageTag: () => T
	readonly onSetLanguageTag: (callback: (language_tag: T) => void) => void
	readonly availableLanguageTags: readonly T[]
	readonly sourceLanguageTag: T
}

export interface I18n<T extends string> {
	readonly languageTag: solid.Accessor<T>
	readonly setLanguageTag: (language_tag: T) => void
	readonly LanguageTagProvider: solid.ContextProviderComponent<T>
}

/**
 * Create an i18n adapter for SolidStart.
 *
 * @param paraglide The compiled paraglide runtime module. (e.g. "paraglide/runtime.js")
 * @returns An i18n adapter for SolidStart.
 * @example
 * ```ts
 * import * as paraglide from '../paraglide/runtime.js'
 *
 * export const {LanguageTagProvider, languageTag, setLanguageTag} = adapter.createI18n(paraglide)
 * ```
 */
export function createI18n<T extends string>(paraglide: Paraglide<T>): I18n<T> {
	let languageTag: I18n<T>["languageTag"]
	let setLanguageTag: I18n<T>["setLanguageTag"]
	let LanguageTagProvider: I18n<T>["LanguageTagProvider"]

	// SERVER
	if (solid_web.isServer) {
		const LanguageTagCtx = solid.createContext<T>()
		LanguageTagProvider = LanguageTagCtx.Provider

		setLanguageTag = () => {
			throw new Error("setLanguageTag not available on server")
		}
		languageTag = () => {
			const ctx = solid.useContext(LanguageTagCtx)
			if (!ctx) {
				throw new Error("LanguageTagCtx not found")
			}
			return ctx
		}

		paraglide.setLanguageTag(languageTag)
	}
	// BROWSER
	else {
		let language_tag: T

		LanguageTagProvider = (props) => {
			language_tag = props.value
			paraglide.setLanguageTag(language_tag)

			const navigate = router.useNavigate()

			/*
            Keep the language tag in the URL
            */
			router.useBeforeLeave((e) => {
				if (typeof e.to !== "string") return

				const from_pathname = normalizePathname(e.from.pathname)
				const from_language_tag = languageTagInPathname(
					from_pathname,
					paraglide.availableLanguageTags
				)
				const to_pathname = normalizePathname(e.to)
				const to_language_tag = languageTagInPathname(to_pathname, paraglide.availableLanguageTags)

				//  /en/foo → /en/bar  |  /foo → /bar
				if (to_language_tag === from_language_tag) return

				e.preventDefault()

				//  /en/foo → /bar  |  /de/foo → /bar
				if (!to_language_tag) {
					navigate("/" + from_language_tag + to_pathname, e.options)
				}
				//  /foo → /en/bar
				else if (to_language_tag === paraglide.sourceLanguageTag && !from_language_tag) {
					navigate(to_pathname.slice(to_language_tag.length + 1), e.options)
				}
				//  /de/foo → /en/bar  |  /foo → /de/bar
				else {
					location.pathname = to_pathname
				}
			})

			return props.children
		}

		setLanguageTag = paraglide.setLanguageTag
		languageTag = () => language_tag

		paraglide.onSetLanguageTag((new_language_tag) => {
			if (new_language_tag === language_tag) return
			const pathname = normalizePathname(location.pathname)
			location.pathname = "/" + new_language_tag + pathname.replace("/" + language_tag, "")
		})
	}

	return {
		languageTag,
		setLanguageTag,
		LanguageTagProvider,
	}
}
