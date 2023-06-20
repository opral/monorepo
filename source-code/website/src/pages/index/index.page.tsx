import { LandingPageLayout as RootLayout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import Hero from "./sections/01-hero/index.jsx"
import Integration from "./sections/02-integration/index.jsx"
import ConfigPage from "./sections/03-config/index.jsx"
import Pricing from "./sections/04-pricing/index.jsx"
import GetStarted from "./sections/06-getStarted/index.jsx"

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
					<Integration />
					<ConfigPage />
					<Pricing />
					<GetStarted />
				</div>
			</RootLayout>
		</>
	)
}
