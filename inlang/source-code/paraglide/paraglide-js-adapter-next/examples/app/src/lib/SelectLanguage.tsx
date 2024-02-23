"use client"
import { availableLanguageTags, AvailableLanguageTag, languageTag } from "@/paraglide/runtime"
import { useRouter, usePathname } from "./i18n"

export function SelectLanguage() {
	const pathname = usePathname()
	const router = useRouter()

	return (
		<select
			value={languageTag()}
			onChange={(e) => router.replace(pathname, { locale: e.target.value as AvailableLanguageTag })}
		>
			{availableLanguageTags.map((lang) => (
				<option key={lang} value={lang}>
					{lang}
				</option>
			))}
		</select>
	)
}
