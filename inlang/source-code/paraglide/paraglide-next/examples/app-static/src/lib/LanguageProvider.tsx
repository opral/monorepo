import { getParams } from "@nimpl/getters/get-params"
import { ClientProvider } from "./ClientProvider"
import {
	isAvailableLanguageTag,
	languageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	setLanguageTag(() => {
		const params = getParams()
		const language = isAvailableLanguageTag(params?.locale) ? params.locale : sourceLanguageTag
		return language
	})

	return (
		<>
			<ClientProvider languageTag={languageTag()} />
			{children}
		</>
	)
}
