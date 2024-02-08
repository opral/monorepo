import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime"
import { ClientComponent } from "./ClientComponent"
import { i18n } from "@/lib/i18n"

export default function Home() {
	return (
		<main>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
			<p>{i18n._env}</p>
			<ClientComponent />
		</main>
	)
}
