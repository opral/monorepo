"use client"
import {
	availableLanguageTags,
	AvailableLanguageTag,
	languageTag,
	setLanguageTag,
} from "@/paraglide/runtime"
import { useRouter, usePathname } from "../i18n"

export function SelectLanguage() {
	const labels: Record<AvailableLanguageTag, string> = {
		en: "🇬🇧 English",
		de: "🇩🇪 Deutsch",
		"de-CH": "🇨🇭 Schweizerdeutsch",
	}

	const pathname = usePathname()
	const router = useRouter()

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
