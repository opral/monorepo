import {
	availableLanguageTags,
	languageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { prefixStrategy } from "./prefixStrategy"
import NextLink from "next/link"
import React from "react"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

export function Link(props: Parameters<typeof NextLink>[0]): ReturnType<typeof NextLink> {
	const lang = props.locale || languageTag()
	const href = translateHref(props.href, lang)

	//If the language changes, we don't want client navigation
	return lang == languageTag() ? (
		<NextLink {...props} href={href} />
	) : (
		<a {...props} href={href.toString()} />
	)
}
