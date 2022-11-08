import { Navigation } from "./Navigation.jsx";
import { tableOfContent } from "./tableOfContent.js";
import type { PageHead } from "@src/renderer/types.js";
import { Layout } from "@src/pages/Layout.jsx";

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
		<Layout>
			<div class="mx-auto max-w-screen-2xl  sm:px-6 md:px-0  ">
				<div class=" flex ">
					<Navigation sections={tableOfContent} />

					{props.markdown ? (
						<div
							class=" max-w-3xl px-8 pb-8 prose mx-auto"
							innerHTML={props.markdown}
						></div>
					) : (
						<p>schade</p>
					)}
				</div>
			</div>
		</Layout>
	);
}
