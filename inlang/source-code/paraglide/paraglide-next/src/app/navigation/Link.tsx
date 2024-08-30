import {
	availableLanguageTags,
	isAvailableLanguageTag,
	languageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"
import { addBasePath, basePath } from "../utils/basePath"
import NextLink from "next/link"
import React, { ComponentProps } from "react"
import { createLocaliseHref } from "../localiseHref"
import { serializeCookie } from "../utils/cookie"
import { LANG_COOKIE } from "../constants"
import { rsc } from "rsc-env"
import { DEV } from "../env"
import type { RoutingStrategy } from "../routing-strategy/interface"

export type LocalizedLink<T extends string> = (
	props: LocalizedLinkProps<T>
) => ReturnType<typeof import("next/link").default>

type LocalizedLinkProps<T extends string> = Omit<
	ComponentProps<typeof import("next/link").default>,
	"locale"
> & { locale?: T }

/**
 * Creates a link component that localises the href based on the current language.
 * @param languageTag A function that returns the current language tag.
 */
export function createLink<T extends string>(strategy: RoutingStrategy<T>) {
	const localiseHref = createLocaliseHref(strategy)

	const Link: LocalizedLink<T> = React.forwardRef((props, ref) => {
		const currentLanguageTag = languageTag() as T

		if (DEV && props.locale && !isAvailableLanguageTag(props.locale)) {
			const disjunctionFormatter = new Intl.ListFormat("en", {
				style: "long",
				type: "disjunction",
			})
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

	return Link
}
