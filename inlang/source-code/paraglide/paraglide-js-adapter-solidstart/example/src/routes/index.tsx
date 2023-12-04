import { Component } from "solid-js"
import { A } from "solid-start"
import * as m from "../paraglide/messages.js"
import { LocaleSwitcher, languageTag } from "../i18n/index.jsx"

const Home: Component = () => {
	return (
		<main>
			<h1>{m.greeting({ name: "Loris", count: 5 })}</h1>
			<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

			<A href="/about">{m.about()}</A>
			<br />
			<LocaleSwitcher />
		</main>
	)
}
export default Home
