"use client"
import {
	availableLanguageTags,
	AvailableLanguageTag,
	languageTag,
	setLanguageTag,
} from "@/paraglide/runtime"

export function SelectLanguage() {
	const labels: Record<AvailableLanguageTag, string> = {
		en: "🇬🇧 English",
		de: "🇩🇪 Deutsch",
		"de-CH": "🇨🇭 Schweizerdeutsch",
	}

	return (
		<select
			value={languageTag()}
			onChange={(e) => setLanguageTag(e.target.value as AvailableLanguageTag)}
		>
			{availableLanguageTags.map((lang) => (
				<option key={lang} value={lang}>
					{labels[lang]}
				</option>
			))}
		</select>
	)
}
