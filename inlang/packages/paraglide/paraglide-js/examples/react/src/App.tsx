import { useState } from "react";
import * as m from "./paraglide/messages.js";
import {
	getLocale,
	setLocale,
	overwriteGetLocale,
	overwriteSetLocale,
	baseLocale,
	type Locale,
} from "./paraglide/runtime.js";

function App() {
	const [localeRenderKey, setLocaleRenderKey] = useState(getLocale());

	overwriteGetLocale(() => {
		return (localStorage.getItem("locale") as Locale) ?? baseLocale;
	});

	overwriteSetLocale((newLocale) => {
		localStorage.setItem("locale", newLocale);
		setLocaleRenderKey(newLocale);
	});

	return (
		// The render key will trigger a re-render when the locale changes
		<div key={localeRenderKey}>
			<button onClick={() => setLocale("en")}>Switch locale to en</button>
			<button onClick={() => setLocale("de")}>Switch locale to de</button>
			<button onClick={() => setLocale("fr")}>Switch locale to fr</button>
			<p>
				{m.jojo_mountain_day({
					username: "John Doe",
					platform: "ios",
					userGender: "male",
				})}
			</p>
		</div>
	);
}

export default App;
