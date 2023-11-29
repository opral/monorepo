import { LocaleSwitcher } from "@/lib/LocaleSwitcher"
import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime"
import Link from "next/link"

export default function Home() {
	return (
		<main>
			<h1>{m.greeting({ name: "Loris", count: 5 })}</h1>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

			<Link href="/about">{m.about()}</Link>
			<br />
			<LocaleSwitcher />
		</main>
	)
}
