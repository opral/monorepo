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
			<div class="min-h-screen bg-on-background">
				<Header></Header>

				<div class="text-primary min-h-full bg-error h-full ">ad</div>
				{/* <div class="mx-auto max-w-screen-2xl h-full  bg-on-background sm:px-6 ">
					<Hero></Hero>
				</div> */}

				<div class="absolute inset-x-0 bottom-0 ">
					<Footer />
				</div>

				{/* 
			<div class="min-h-full	">
				
			</div> */}
			</div>
		</>
	);
}
