import {
	availableLanguageTags,
	languageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { prefixStrategy } from "./utils"
import NextLink, { type LinkProps } from "next/link"
import React from "react"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

export function Link(props: LinkProps): ReturnType<typeof NextLink> {
	const lang = props.locale || languageTag()
	const href = translateHref(props.href, lang)

	//If the language changes, we don't want client navigation
	return lang == languageTag() ? (
		<NextLink {...props} href={href} />
	) : (
		<a {...props} href={href.toString()} />
	)
}
