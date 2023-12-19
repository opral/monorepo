import { languageTag, setLanguageTag } from "$paraglide-adapter-next-internal/runtime.js"
import { headers } from "next/headers"
import { ClientLanguageProvider } from "./ClientLanguageProvider"
import React from "react"

//This only needs to be called once, so it's fine to do it here
setLanguageTag(() => {
	const lang = headers().get("x-language-tag") as any
	return lang
})

export default function LanguageProvider(props: { children: React.ReactNode }): React.ReactElement {
	//we make the client side language provider a sibling of the children
	//That way the entire app isn't turned into a client component
	return (
		<>
			{/* Pass the language tag to the client */}
			<ClientLanguageProvider language={languageTag()} />
			{props.children}
		</>
	)
}
