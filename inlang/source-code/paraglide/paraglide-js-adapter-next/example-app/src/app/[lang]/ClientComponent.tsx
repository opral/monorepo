"use client"
import * as m from "@/paraglide/messages.js"
import { languageTag, setLanguageTag } from "@/paraglide/runtime"

export function ClientComponent() {
	return (
		<>
			<p>I'm on the client</p>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
		</>
	)
}
