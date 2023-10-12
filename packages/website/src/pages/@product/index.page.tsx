import PlannedHero from "#src/components/sections/plannedHero/index.jsx"
import { Meta, Title } from "@solidjs/meta"
import { Show, createSignal } from "solid-js"
import { LandingPageLayout as RootLayout } from "../Layout.jsx"
import GlobalAppBanner from "#src/components/sections/plannedHero/globalAppBanner.jsx"
import Marketplace from "#src/components/sections/marketplace/index.jsx"

export type PageProps = {
	slug: string
	content: {
		title: string
		description: string
	}
}

export function Page(props: PageProps) {
	const [darkmode, setDarkmode] = createSignal(true)
	const [transparent, setTransparent] = createSignal(true)

	if (typeof window !== "undefined") {
		window.addEventListener("scroll", () => {
			if (window.scrollY > 620) {
				setDarkmode(false)
			} else {
				setDarkmode(true)
			}

			if (window.scrollY > 50) {
				setTransparent(false)
			} else {
				setTransparent(true)
			}
		})
	}

	return (
		<>
			<Title>inlang {props.content && props.content.title}</Title>
			<Meta name="description" content={props.content && props.content.description} />
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout landingpage darkmode={darkmode()} transparent={transparent()}>
				<Show when={props.content}>
					<PlannedHero slug={props.slug} content={props.content} />
				</Show>
				{/* <GlobalAppBanner /> */}
				<Marketplace minimal category={props.content.title.toLowerCase()} />
			</RootLayout>
		</>
	)
}
