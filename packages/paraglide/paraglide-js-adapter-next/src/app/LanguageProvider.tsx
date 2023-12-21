import React from "react"
import {
	languageTag,
	setLanguageTag,
	isAvailableLanguageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { headers } from "next/headers"
import { ClientLanguageProvider } from "./ClientLanguageProvider"
import { LangaugeSpy } from "./LanguageSpy"
import { LANGUAGE_HEADER } from "../constants"

setLanguageTag(() => {
	const langHeader = headers().get(LANGUAGE_HEADER)
	if (isAvailableLanguageTag(langHeader)) return langHeader
	return sourceLanguageTag
})

export default function LanguageProvider(props: { children: React.ReactNode }): React.ReactElement {
	//we make the client side language provider a sibling of the children
	//That way the entire app isn't turned into a client component
	return (
		<>
			{/* Pass the language tag to the client */}
			<ClientLanguageProvider language={languageTag()} />
			{/* Refresh when the language changes */}
			<LangaugeSpy />
			<React.Fragment key={languageTag()}>{props.children}</React.Fragment>
		</>
	)
}
