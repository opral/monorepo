/**
 * -------------------------------------
 * Only runs server side because markdown files are
 * read from the filesystem.
 *
 * Be aware that routing to this page needs to happen server side.
 * -------------------------------------
 */

import { parseValidateAndRender } from "@src/services/markdoc/parseValidateAndRender.js";
import { Header } from "./Header.jsx";
import { Navigation } from "./Navigation.jsx";
import { tableOfContent } from "./tableOfContent.js";
import type { OnBeforeRender, PageHead } from "@src/renderer/types.js";
import { Footer } from "./Footer.jsx";

export const Head: PageHead = () => {
	return {
		title: "Documentation",
		description: "Documentation",
	};
};

export const onBeforeRender: OnBeforeRender<PageProps> = async (
	pageContext
) => {
	const fs = await import("node:fs/promises");
	let markdown: string | undefined;
	try {
		const text = await fs.readFile(
			`../../documentation/${pageContext.routeParams.id}.md`,
			"utf8"
		);
		markdown = parseValidateAndRender(text);
	} catch (error) {
		console.log("error in onBeforeRender", error);
	} finally {
		return {
			pageContext: {
				props: {
					markdown,
				},
			},
		};
	}
};

type PageProps = {
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
