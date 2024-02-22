import {
	availableLanguageTags,
	sourceLanguageTag,
	isAvailableLanguageTag,
} from "$paraglide/runtime.js"
import { addBasePath } from "./routing/basePath"
import { prefixStrategy } from "./routing/prefix"
import NextLink from "next/link"
import React from "react"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

/**
 * Creates a link component that localises the href based on the current language.
 * @param languageTag A function that returns the current language tag.
 */
export function createLink(languageTag: () => string) {
	return function Link(props: Parameters<typeof NextLink>[0]): ReturnType<typeof NextLink> {
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
				`Invalid locale prop passed to <Link> component.\nExpected ${availableLanguageTagsString}, but got "${props.locale}".\nFalling back to the source language tag "${sourceLanguageTag}". \n\n(This warning will not be shown in production)`
			)
		}

		let lang = props.locale || currentLanguageTag
		if (!isAvailableLanguageTag(lang)) lang = sourceLanguageTag

		const localisedHref = translateHref(props.href, lang)

		//If the language changes, we don't want client navigation
		return lang == currentLanguageTag ? (
			<>
				<NextLink {...props} href={localisedHref} />
			</>
		) : (
			<a {...props} href={addBasePath(localisedHref.toString())} />
		)
	}
}
