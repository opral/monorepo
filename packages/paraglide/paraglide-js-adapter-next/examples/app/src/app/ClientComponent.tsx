"use client"
import * as m from "@/paraglide/messages"
import { languageTag } from "@/paraglide/runtime"
import { useRouter } from "@inlang/paraglide-js-adapter-next/navigation"

export function ClientComponent() {
	const router = useRouter()

	return (
		<div>
			<h1>{m.on_the_client()}</h1>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
			<button onClick={() => router.push("/about")}>{m.about()}</button>
		</div>
	)
}
