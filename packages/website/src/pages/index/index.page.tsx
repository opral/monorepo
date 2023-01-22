import { Layout as RootLayout } from "../Layout.jsx";
import { Hero } from "./Hero.jsx";
import styles from "./github-markdown.module.css";
import { Meta, Title } from "@solidjs/meta";

export type PageProps = {
	markdown: string;
};

export function Page(props: PageProps) {
	return (
		<>
			<Title>inlang Developer-first localization infrastructure.</Title>
			<Meta
				name="description"
				content="Inlang provides dev tools, an editor to manage translations and automation via CI/CD to streamline localization."
			 />
			<RootLayout>
				<div class="self-center grow sm:px-6 md:px-0 mb-8">
					<Hero />
					{/* rendering the github readme */}
					<div
						class="p-4 md:p-6 rounded-lg border border-outline"
						classList={{ [styles["markdown-body"]]: true }}
						innerHTML={props.markdown}
					 />
				</div>
			</RootLayout>
		</>
	);
}
