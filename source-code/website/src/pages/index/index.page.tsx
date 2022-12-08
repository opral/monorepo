import type { PageHead } from "@src/renderer/types.js";
import { Layout as RootLayout } from "../Layout.jsx";
import { Hero } from "./Hero.jsx";

export const Head: PageHead = () => {
	return {
		title: "inlang",
		description: "Developer-first localization infrastructure for software.",
	};
};

export function Page() {
	return (
		<RootLayout>
			<div class="self-center grow sm:px-6 md:px-0">
				<Hero></Hero>
			</div>
		</RootLayout>
	);
}
