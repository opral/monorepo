import { m } from "../paraglide/messages.js";
import { localizeHref, setLocale } from "../paraglide/runtime.js";

export default function Home() {
	return (
		<>
			<p>{m.blue_box_doll()}</p>
			<div style={{ display: "flex", gap: 10 }}>
				<p>Change locale to </p>
				<button onClick={() => setLocale("en")}>en</button>
				<button onClick={() => setLocale("de")}>de</button>
			</div>
			<a href={localizeHref("/about")}>go to about</a>
		</>
	);
}
