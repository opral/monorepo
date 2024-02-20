import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { getLanguage } from "./getLanguage.server"
import { prefixStrategy } from "./routing/prefix"
import NextLink from "next/link"
import React from "react"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

export function Link(props: Parameters<typeof NextLink>[0]): ReturnType<typeof NextLink> {
	const lang = props.locale || getLanguage()
	const href = translateHref(props.href, lang)

	//If the language changes, we don't want client navigation
	return lang == getLanguage() ? (
		<NextLink {...props} href={href} />
	) : (
		<a {...props} href={href.toString()} />
	)
}
