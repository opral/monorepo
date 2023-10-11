import * as m from "@inlang/paraglide-js/messages"
import { changeLanguageTag, languageTag } from "@inlang/paraglide-js"

function App() {
	console.log("rendering app")
	return (
		<>
			<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
			<p>{m.currentLanguageTag({ languageTag })}</p>
			<button onClick={() => changeLanguageTag("de")}>change language to "de"</button>
			<button onClick={() => changeLanguageTag("en")}>change language to "en"</button>
		</>
	)
}

export default App
