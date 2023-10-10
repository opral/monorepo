import * as m from "@inlang/paraglide-js/messages"
import { setLanguageTag, languageTag } from "@inlang/paraglide-js"

function App() {
	console.log("rendering app")
	return (
		<>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag })}</p>
			<button onClick={() => setLanguageTag("de")}>change language to "de"</button>
			<button onClick={() => setLanguageTag("en")}>change language to "en"</button>
		</>
	)
}

export default App
