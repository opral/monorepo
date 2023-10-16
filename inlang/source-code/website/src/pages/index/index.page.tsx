import { LandingPageLayout as RootLayout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"

export type PageProps = {
	markdown: string
}

export function Page() {
	return (
		<>
			<Title>Globalization infrastructure for software</Title>
			<Meta
				name="description"
				content="inlang's ecosystem makes adapting your application to different markets easy."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout landingpage>
				inlang Marketplace
			</RootLayout>
		</>
	)
}
