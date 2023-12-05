import { Component } from "solid-js"
import { A } from "solid-start"
import * as m from "../paraglide/messages.js"
import { LocaleSwitcher } from "../i18n/index.jsx"

const About: Component = () => {
	return (
		<main>
			<h1>{m.about()}</h1>

			<A href="/">{m.home()}</A>
			<br />
			<LocaleSwitcher />
		</main>
	)
}
export default About
