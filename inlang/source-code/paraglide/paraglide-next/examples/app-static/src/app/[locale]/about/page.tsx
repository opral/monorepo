import { initializeLocaleCache } from "@/lib/localeCache"
import * as m from "@/paraglide/messages.js"
import { AvailableLanguageTag } from "@/paraglide/runtime"

export default function Page({ params }: { params: { locale: AvailableLanguageTag } }) {
	initializeLocaleCache(params.locale)

	return <h1>{m.about()}</h1>
}
