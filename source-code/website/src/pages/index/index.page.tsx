import { LandingPageLayout as RootLayout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import Hero from "./sections/01-hero/index.jsx"
import Credibility from "./sections/02-credibility/index.jsx"
import Editor from "./sections/03-editor/index.jsx"
import VsCodeExtension from "./sections/04-vscodExtension/index.jsx"
import Cli from "./sections/05-cli/index.jsx"

export type PageProps = {
	markdown: string
}

export function Page() {
	return (
		<>
			<Title>inlang Developer-first localization infrastructure.</Title>
			<Meta
				name="description"
				content="Inlang provides dev tools, an editor to manage translations and automation via CI/CD to streamline localization."
			/>
			<RootLayout landingpage>
				<div>
					<Hero />
					<Credibility />
					<Editor />
					<VsCodeExtension />
					<Cli />
				</div>
			</RootLayout>
		</>
	)
}
