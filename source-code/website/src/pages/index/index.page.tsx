import type { PageHead } from "@src/renderer/types.js";
import { Layout as RootLayout } from "../Layout.jsx";
import { Hero } from "./Hero.jsx";
import styles from "./github-markdown.module.css";

export type PageProps = {
	markdown: string;
};

export const Head: PageHead = () => {
	return {
		title: "inlang",
		description: "Developer-first localization infrastructure for software.",
	};
};

export function Page(props: PageProps) {
	return (
		<RootLayout>
			<div class="self-center grow sm:px-6 md:px-0 mb-8">
				<Hero></Hero>
				{/* rendering the github readme */}
				<div
					class="p-4 md:p-6 rounded-lg border border-outline"
					classList={{ [styles["markdown-body"]]: true }}
					innerHTML={props.markdown}
				></div>
			</div>
		</RootLayout>
	);
}
