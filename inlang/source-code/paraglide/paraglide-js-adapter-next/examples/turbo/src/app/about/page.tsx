import * as m from "@/paraglide/messages.js"
import { ClientComponent } from "../ClientComponent"

export default function About() {
	return (
		<>
			<main>
				<p>{m.about()}</p>
				<ClientComponent />
			</main>
		</>
	)
}
