import { Header } from "./Header.jsx";
import { Navigation } from "./Navigation.jsx";
import { tableOfContent } from "./tableOfContent.js";
import type { PageHead } from "@src/renderer/types.js";
import { Footer } from "./Footer.jsx";

export const Head: PageHead = () => {
	return {
		title: "Documentation",
		description: "Documentation",
	};
};

export type PageProps = {
	markdown?: string;
};

export function Page(props: PageProps) {
	return (
		<>
			<Header />
			<div class="mx-auto max-w-screen-2xl  sm:px-6 md:px-0  ">
				<div class=" flex ">
					<Navigation sections={tableOfContent} />

					{props.markdown ? (
						<div class=" w-full prose mx-auto" innerHTML={props.markdown}></div>
					) : (
						<p>schade</p>
					)}
				</div>
			</div>

			<Footer />
		</>
	);
}
