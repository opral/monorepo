import { LocaleSwitcher } from "@/lib/LocaleSwitcher"
import Link from "next/link"
import * as m from "@/paraglide/messages.js"

export default function Home() {
	return (
		<main>
			<h1>{m.about()}</h1>

			<Link href="/">{m.home()}</Link>
			<br />
			<LocaleSwitcher />
		</main>
	)
}
