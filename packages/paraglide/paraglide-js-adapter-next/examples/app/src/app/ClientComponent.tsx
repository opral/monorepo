"use client"
import * as m from "@/paraglide/messages"
import { languageTag } from "@/paraglide/runtime"
import { useRouter, Link, usePathname } from "@/lib/i18n"

export function ClientComponent() {
	const router = useRouter()
	const pathname = usePathname()

	return (
		<div>
			<p>{pathname}</p>
			<Link href="/about">{m.about()}</Link>
			<h1>{m.on_the_client()}</h1>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

			<button onClick={() => router.push("/about", { locale: "de" })}>
				{m.about({}, { languageTag: "de" })}
			</button>
		</div>
	)
}
