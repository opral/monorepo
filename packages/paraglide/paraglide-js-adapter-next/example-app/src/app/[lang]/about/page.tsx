import Link from "next/link"

export default function About() {
	return (
		<>
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
