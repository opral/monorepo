import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime.js"

export default function Home() {
	return (
		<main>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

			<a href="/de">
				<button>change language to "de"</button>
			</a>
			<a href="/en">
				<button>change language to "en"</button>
			</a>
		</main>
	)
}
