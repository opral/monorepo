import { Link } from "@/lib/i18n"
import * as m from "@/paraglide/messages.js"
import { ClientComponent } from "../ClientComponent"

export default function About() {
	return (
		<>
			<main>
				<p>{m.about()}</p>
				<Link href="/">Home</Link>
				<ClientComponent />
			</main>
		</>
	)
}
