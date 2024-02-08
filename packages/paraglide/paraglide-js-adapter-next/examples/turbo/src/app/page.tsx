import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime"
import { ClientComponent } from "./ClientComponent"

export default function Home() {
	return (
		<main>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
			<ClientComponent />
		</main>
	)
}
