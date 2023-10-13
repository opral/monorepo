import CategoryHero from "../components/sections/categoryHero/index.jsx"
import { Meta, Title } from "@solidjs/meta"
import { Show } from "solid-js"
import { Layout } from "./Layout.jsx"
import Marketplace, { type Category } from "../components/sections/marketplace/index.jsx"

export type PageProps = {
	slug: string
	content: {
		title: string
		description: string
	}
}

export function CategoryPage(props: PageProps) {
	return (
		<>
			<Title>inlang {props.content && props.content.title}</Title>
			<Meta name="description" content={props.content && props.content.description} />
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<Layout>
				<div class="mb-40">
					<Show when={props.content}>
						<CategoryHero slug={props.slug} content={props.content} />
						<Show when={props.content.title !== "Global Application"}>
							<Marketplace minimal />
						</Show>
						<Marketplace
							minimal={props.content.title !== "Global Application"}
							slider={props.content.title !== "Global Application"}
							highlights={
								props.content.title === "Global Application"
									? [
											{
												type: "banner",
												color: "#f66900",
												title: "ParaglideJS (former SDK-JS)",
												slogan: "Coming soon",
												description: "The all new library for all common frameworks.",
												link: "/m/library.inlang.paraglideJsSveltekit",
												image:
													"https://cdn.jsdelivr.net/gh/inlang/monorepo@website-update/inlang/assets/marketplace/paraglide-artwork.gif",
											},
									  ]
									: []
							}
							category={props.content && (props.content.title.toLowerCase() as Category)}
						/>
					</Show>
				</div>
			</Layout>
		</>
	)
}
