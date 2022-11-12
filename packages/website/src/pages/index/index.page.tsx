import type { PageHead } from "@src/renderer/types.js";
import { Layout as RootLayout } from "../Layout.jsx";
import { Counter } from "./Counter.js";
import { Hero } from "./Hero.jsx";
export const Head: PageHead = () => {
	return {
		title: "inlang",
		description: "Developer-first localization infrastructure for software.",
	};
};

export function Layout() {
	return RootLayout;
}

export function Page() {
	return (
		<div class="  min-h-screen flex  content-center justify-center">
			<div class="mx-auto max-w-screen-2xl  place-content-center	 self-center h-full grow   ">
				<Hero></Hero>
			</div>

			{/* 
			<div class="min-h-full	">
			
		</div> */}
		</div>
	);
}
