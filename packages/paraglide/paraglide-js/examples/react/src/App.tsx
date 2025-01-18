import { useState } from "react";
import * as m from "./paraglide/messages.js";
import {
	getLocale,
	setLocale,
	defineGetLocale,
	defineSetLocale,
	baseLocale,
	type Locale,
} from "./paraglide/runtime.js";

function App() {
	const [localeRenderKey, setLocaleRenderKey] = useState(getLocale());

	defineGetLocale(() => {
		return (localStorage.getItem("locale") as Locale) ?? baseLocale;
	});

	defineSetLocale((newLocale) => {
		localStorage.setItem("locale", newLocale);
		setLocaleRenderKey(newLocale);
	});

	return (
		// The render key will trigger a re-render when the locale changes
		<div key={localeRenderKey}>
			<button onClick={() => setLocale("en")}>Switch locale to en</button>
			<button onClick={() => setLocale("de")}>Switch locale to de</button>
			<button onClick={() => setLocale("fr")}>Switch locale to fr</button>
			<p>{m.orange_dog_wheel()}</p>
		</div>
	);
}

export default App;
