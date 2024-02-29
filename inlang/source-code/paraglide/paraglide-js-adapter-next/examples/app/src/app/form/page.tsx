import * as m from "@/paraglide/messages.js"
import { languageTag } from "@/paraglide/runtime"
import { redirect, Link } from "@/lib/i18n"

export default function About() {
	async function log(formData: FormData) {
		"use server"
		console.info(formData, languageTag())
		return redirect("/")
	}

	return (
		<>
			<main>
				<p>{m.about()}</p>

				<Link href="/">Home</Link>

				<form action={log}>
					<input name="text" type="text" placeholder="asd" />

					<button>Submit</button>
				</form>
			</main>
		</>
	)
}
