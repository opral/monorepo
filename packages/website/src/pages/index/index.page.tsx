import type { PageHead } from "@src/renderer/types.js";
import { Layout } from "../Layout.jsx";
import { Counter } from "./Counter.js";
import { Hero } from "./Hero.jsx";
export const Head: PageHead = () => {
	return {
		title: "inlang",
		description: "Developer-first localization infrastructure for software.",
	};
};

export function Page() {
	return (
		<Layout>
			<div class="min-h-screen flex  content-center justify-center">
				<div class="absolute inset-x-0 top-0 "></div>

				<div class="mx-auto max-w-screen-2xl  place-content-center	 self-center h-full grow   ">
					<Hero></Hero>
				</div>

				{/* 
			<div class="min-h-full	">
			
		</div> */}
			</div>
		</Layout>
	);
}
