import { Layout as RootLayout } from "../Layout.jsx"
import { Hero } from "./Hero.jsx"
import styles from "./github-markdown.module.css"
import { Meta, Title } from "@solidjs/meta"
import { CommunityProjects } from "./CommunityProjects.jsx"

export type PageProps = {
	markdown: string
}

export function Page(props: PageProps) {
	return (
		<>
			<Title>inlang Developer-first localization infrastructure.</Title>
			<Meta
				name="description"
				content="Inlang provides dev tools, an editor to manage translations and automation via CI/CD to streamline localization."
			/>
			<RootLayout>
				<div class="self-center grow sm:px-6 md:px-0 mb-8 flex flex-col">
					<Hero />
					<div class="flex flex-col gap-12">
						{/* rendering the github readme */}
						<div
							class="mb-8 p-4 md:p-6 rounded-lg border border-outline"
							classList={{ [styles["markdown-body"]]: true }}
							// eslint-disable-next-line solid/no-innerhtml
							innerHTML={props.markdown}
						/>
					</div>
					<CommunityProjects />
				</div>
			</RootLayout>
		</>
	)
}
