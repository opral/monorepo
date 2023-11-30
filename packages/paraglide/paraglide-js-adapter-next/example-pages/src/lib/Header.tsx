import { availableLanguageTags, sourceLanguageTag } from "@/paraglide/runtime"
import Head from "next/head"
import { useRouter } from "next/router"

/**
 * Adds alternate links for all available languages to the head.
 */
export function Header() {
	const { asPath } = useRouter()

	function getPathInLanguage(languageTag: string) {
		if (languageTag === sourceLanguageTag) return asPath
		return `/${languageTag}${asPath}`
	}

	return (
		<Head>
			{availableLanguageTags.map((lang) => (
				<link rel="alternate" hrefLang={lang} href={getPathInLanguage(lang)} key={lang} />
			))}
		</Head>
	)
}
