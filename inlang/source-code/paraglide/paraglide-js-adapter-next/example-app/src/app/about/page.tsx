import { Link } from "@inlang/paraglide-js-adapter-next"
import * as m from "@/paraglide/messages.js"

export default function About() {
	return (
		<>
			<main>
				<p>{m.about()}</p>
				<Link href="/">Home</Link>
			</main>
		</>
	)
}
