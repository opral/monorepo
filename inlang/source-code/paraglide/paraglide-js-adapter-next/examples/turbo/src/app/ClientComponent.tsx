"use client"
import * as m from "@/paraglide/messages"
import { languageTag } from "@/paraglide/runtime"
import { i18n } from "@/lib/i18n"

export function ClientComponent() {
	return (
		<div>
			<h1>{m.on_the_client()}</h1>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
			<p>{i18n._env}</p>
		</div>
	)
}
