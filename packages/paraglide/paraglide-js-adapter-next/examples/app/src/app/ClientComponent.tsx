"use client"
import * as m from "@/paraglide/messages"
import { languageTag } from "@/paraglide/runtime"
import { useRouter } from "@inlang/paraglide-js-adapter-next"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function ClientComponent() {
	const router = useRouter()
	const pathname = usePathname()

	return (
		<div>
			<p>{pathname}</p>
			<Link href="/about" prefetch>
				{m.about()}
			</Link>
			<h1>{m.on_the_client()}</h1>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
			<button onClick={() => router.push("/about")}>{m.about()}</button>
		</div>
	)
}
