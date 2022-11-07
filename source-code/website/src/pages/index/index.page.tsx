import type { PageHead } from "@src/renderer/types.js";
import { Counter } from "./Counter.js";
import { Header } from "../documentation/@id/Header.jsx";
import { Hero } from "./Hero.jsx";
import { Footer } from "../documentation/@id/Footer.jsx";
import { Feature } from "./Feature.jsx";
export const Head: PageHead = () => {
	return {
		title: "inlang",
		description: "Developer-first localization infrastructure for software.",
	};
};

export function Page() {
	return (
		<>
			<div class="min-h-screen flex  content-center justify-center">
				<div class="absolute inset-x-0 top-0 ">
					<Header />
				</div>

				<div class="mx-auto max-w-screen-2xl  place-content-center	 self-center h-full grow   ">
					<Hero></Hero>
				</div>

				<Footer />

				{/* 
			<div class="min-h-full	">
				
			</div> */}
			</div>
		</>
	);
}
