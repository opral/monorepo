import CategoryHero from "#src/components/sections/categoryHero/index.jsx"
import { Meta, Title } from "@solidjs/meta"
import { Show, createSignal } from "solid-js"
import { Layout, LandingPageLayout as RootLayout } from "../Layout.jsx"
import Marketplace from "#src/components/sections/marketplace/index.jsx"
import { Button } from "../index/components/Button.jsx"
import Highlight from "#src/components/Highlight.jsx"

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
			<Layout>
				<Show when={props.content}>
					<CategoryHero slug={props.slug} content={props.content} />
				</Show>
				{/* <GlobalAppBanner /> */}
				<Marketplace
					minimal={props.content.title !== "Global App"}
					highlights={
						props.content.title === "Global App"
							? [
									{
										color: "#f66900",
										title: "ParaglideJS (former SDK-JS)",
										type: "Featured",
										description: "The all new library for all common frameworks.",
										link: "/m/library.inlang.paraglideJsSveltekit",
										image:
											"https://cdn.jsdelivr.net/gh/inlang/monorepo@website-update/inlang/assets/marketplace/paraglide-artwork.gif",
									},
							  ]
							: []
					}
					category={props.content && props.content.title.toLowerCase()}
				/>
			</Layout>
		</>
	)
}
