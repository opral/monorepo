import Link from "next/link"
import { Header } from "@inlang/paraglide-js-adapter-next"
import Head from "next/head"

export default function About() {
	return (
		<>
			<Head>
				<title>About</title>
			</Head>
			<main>
				<p>about page</p>
				<a href="/de">Home</a>
				<Link href="/" locale="de">
					Home
				</Link>
			</main>
		</>
	)
}
