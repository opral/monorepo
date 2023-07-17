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
			<Title>Globalization infrastructure for software</Title>
			<Meta
				name="description"
				content="inlang's ecosystem makes adapting your application to different markets easy."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout landingpage>
				<div>
					<Hero />
					<Integration />
					<ConfigPage />
					<Pricing />
					<GetStarted />

					{/* Temporary Product Hunt Badge –– Will be removed after launch */}
					<div class="max-w-screen-xl px-10 w-full sticky bottom-0 flex justify-end h-0 -translate-y-20 z-50 mx-auto pointer-events-none">
						<a
							href="https://www.producthunt.com/posts/inlang-vscode-extension-for-i18n-beta?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-inlang&#0045;vscode&#0045;extension&#0045;for&#0045;i18n&#0045;beta"
							target="_blank"
							class="pointer-events-auto"
						>
							<img
								src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=404697&theme=neutral"
								alt="inlang&#0032;VSCode&#0032;extension&#0032;for&#0032;i18n&#0032;&#0040;beta&#0041; - Extension&#0032;for&#0032;i18n&#0032;codebases&#0032;making&#0032;developers&#0032;life&#0039;s&#0032;easier | Product Hunt"
								style={{ width: "250px", height: "54px" }}
								width="250"
								height="54"
							/>
						</a>
					</div>
				</div>
			</RootLayout>
		</>
	)
}
