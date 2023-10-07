import * as m from "@inlang/paraglide-js/messages"
import { languageTag } from "@inlang/paraglide-js"

export default function Home() {
	return (
		<main>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag })}</p>
			<a href="/de">
				<button>change language to "de"</button>
			</a>
			<a href="/en">
				<button>change language to "en"</button>
			</a>
		</main>
	)
}
