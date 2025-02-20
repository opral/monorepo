import { m } from "../paraglide/messages.js";
import { localizeHref } from "../paraglide/runtime.js";

export default function About() {
	return (
		<>
			<p>{m.blue_box_doll()}</p>
			<a href={localizeHref("/")}>back to home</a>
		</>
	);
}
