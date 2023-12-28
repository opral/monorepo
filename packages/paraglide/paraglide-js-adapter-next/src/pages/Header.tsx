import {
	availableLanguageTags,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import Head from "next/head"
import { useRouter } from "next/router"
import React from "react"

/**
 * Adds alternate links for all available languages to the head.
 */
export default function Header(): React.ReactNode {
	const { asPath } = useRouter()

	function getTranslatedPath(languageTag: string) {
		if (languageTag === sourceLanguageTag) return asPath
		return `/${languageTag}${asPath}`
	}

	return (
		<Head>
			{availableLanguageTags.map((lang) => (
				<link rel="alternate" hrefLang={lang} href={getTranslatedPath(lang)} key={lang} />
			))}
		</Head>
	)
}
