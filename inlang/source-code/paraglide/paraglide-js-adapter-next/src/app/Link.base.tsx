import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"
import NextLink from "next/link"
import React from "react"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

export function createLink(languageTag: () => string) {
	return function Link(props: Parameters<typeof NextLink>[0]): ReturnType<typeof NextLink> {
		const currentLanguageTag = languageTag()

		const lang = props.locale || currentLanguageTag
		const href = translateHref(props.href, lang)

		//If the language changes, we don't want client navigation
		return lang == currentLanguageTag ? (
			<NextLink {...props} href={href} />
		) : (
			<NextLink href={href} passHref legacyBehavior>
				<a {...props} href={href.toString()} />
			</NextLink>
		)
	}
}
