import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime.js"
import { ClientComponent } from "./ClientComponent"
import Link from "next/link"

export default function Home() {
	return (
		<main>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

			<Link href="/de">change language to "de"</Link>
			<Link href="/en">change language to "en"</Link>

			<ClientComponent />
		</main>
	)
}
