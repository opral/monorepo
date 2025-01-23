"use client";

import { setLocale } from "./paraglide/runtime";

export default function ClientSideLocaleSwitch() {
	return (
		<div>
			<div>
				<button onClick={() => setLocale("en")}>Switch to 'en'</button>
			</div>
			<div>
				<button onClick={() => setLocale("de")}>Switch to 'de'</button>
			</div>
		</div>
	);
}
