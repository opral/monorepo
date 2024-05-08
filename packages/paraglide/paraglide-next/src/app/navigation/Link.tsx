import {
	availableLanguageTags,
	isAvailableLanguageTag,
	languageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"
import { addBasePath, basePath } from "../utils/basePath"
import NextLink from "next/link"
import React from "react"
import { RoutingStrategy } from "../routing-strategy/interface"
import { createLocaliseHref } from "../localiseHref"
import { serializeCookie } from "../utils/cookie"
import { LANG_COOKIE } from "../constants"
import { rsc } from "rsc-env"
import { DEV } from "../env"

type LocalisedLink<T extends string> = (
	props: Omit<Parameters<typeof import("next/link").default>[0], "locale"> & { locale?: T }
) => ReturnType<typeof import("next/link").default>

/**
 * Creates a link component that localises the href based on the current language.
 * @param languageTag A function that returns the current language tag.
 */
export function createLink<T extends string>(strategy: RoutingStrategy<T>): LocalisedLink<T> {
	const localiseHref = createLocaliseHref(strategy)

	return React.forwardRef<
		HTMLAnchorElement,
		Omit<Parameters<typeof NextLink>[0], "locale"> & { locale?: T }
	>((props, ref): ReturnType<typeof NextLink> => {
		const currentLanguageTag = languageTag() as T

		if (DEV && props.locale && !isAvailableLanguageTag(props.locale)) {
			const disjunctionFormatter = new Intl.ListFormat("en", { style: "long", type: "disjunction" })
			const availableLanguageTagsString = disjunctionFormatter.format(
				availableLanguageTags.map((tag) => `"${tag}"`)
			)

			console.warn(
				`Invalid locale prop passed to <Link> component.\nExpected ${availableLanguageTagsString}, but got "${props.locale}".\nFalling back to the default language "${sourceLanguageTag}". \n\n(This warning will not be shown in production)`
			)
		}

		const lang = props.locale || currentLanguageTag || (sourceLanguageTag as T)
		const isLanguageSwitch = lang !== currentLanguageTag
		const localisedHref = localiseHref(props.href, lang, "", isLanguageSwitch)

		function updateLangCookie(newLang: T) {
			document.cookie = serializeCookie({
				...LANG_COOKIE,
				value: newLang,
				Path: basePath,
			})
		}

		//If the language changes, we don't want client navigation
		return !isLanguageSwitch ? (
			<NextLink {...props} href={localisedHref} ref={ref} />
		) : rsc ? (
			<a {...props} hrefLang={lang} href={addBasePath(localisedHref.toString())} ref={ref} />
		) : (
			<a
				{...props}
				onClick={() => updateLangCookie(lang)}
				hrefLang={lang}
				href={addBasePath(localisedHref.toString())}
				ref={ref}
			/>
		)
	})
}
