import { availableLanguageTags, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { addBasePath, basePath } from "./utils/basePath"
import NextLink from "next/link"
import React from "react"
import { RoutingStragey } from "./routing/interface"
import { createLocaliseHref } from "./localiseHref"
import type { ResolvedI18nConfig } from "./config"
import { serializeCookie } from "./utils/cookie"
import { LANG_COOKIE } from "./constants"

/**
 * Creates a link component that localises the href based on the current language.
 * @param languageTag A function that returns the current language tag.
 */
export function createLink<T extends string>(
	languageTag: () => T,
	config: ResolvedI18nConfig<T>,
	strategy: RoutingStragey<T>
) {
	const localiseHref = createLocaliseHref(strategy)

	return function Link(
		props: Omit<Parameters<typeof NextLink>[0], "locale"> & { locale?: T }
	): ReturnType<typeof NextLink> {
		const currentLanguageTag = languageTag()

		if (
			process.env.NODE_ENV === "development" &&
			props.locale &&
			!isAvailableLanguageTag(props.locale)
		) {
			const disjunctionFormatter = new Intl.ListFormat("en", { style: "long", type: "disjunction" })
			const availableLanguageTagsString = disjunctionFormatter.format(
				availableLanguageTags.map((tag) => `"${tag}"`)
			)

			console.warn(
				`Invalid locale prop passed to <Link> component.\nExpected ${availableLanguageTagsString}, but got "${props.locale}".\nFalling back to the default language "${config.defaultLanguage}". \n\n(This warning will not be shown in production)`
			)
		}

		let lang = props.locale || currentLanguageTag
		if (!isAvailableLanguageTag(lang)) lang = config.defaultLanguage

		const localisedHref = localiseHref(props.href, lang)

		function updateLangCookie(newLang: T) {
			document.cookie = serializeCookie({
				...LANG_COOKIE,
				value: newLang,
				path: basePath,
			})
		}

		//If the language changes, we don't want client navigation
		return lang == currentLanguageTag ? (
			<>
				<NextLink {...props} href={localisedHref} />
			</>
		) : (
			<a
				{...props}
				onClick={() => updateLangCookie(lang)}
				hrefLang={lang}
				href={addBasePath(localisedHref.toString())}
			/>
		)
	}
}
