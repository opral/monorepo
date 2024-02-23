import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime"
import { ClientComponent } from "./ClientComponent"
import { Link } from "@/lib/i18n"

export default function Home() {
	return (
		<main>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

			<Link href="/about">{m.about()}</Link>
			<br />

			<Link href="/form">Form Flow</Link>
			<br />

			<Link href="/form" locale="en">
				Form Flow (en)
			</Link>
			<br />
			<ClientComponent />
		</main>
	)
}
