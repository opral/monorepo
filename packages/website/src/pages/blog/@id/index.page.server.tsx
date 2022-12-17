import type { OnBeforeRender } from "@src/renderer/types.js";
import { parseValidateAndRender } from "@src/services/markdown/parseValidateAndRender.js";
import type { PageProps } from "./index.page.jsx";
import { tableOfContents } from "../../../../../../content/blog/tableOfContents.js";
// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (
	pageContext
) => {
	const fs = await import("node:fs/promises");
	let markdown: string | undefined;
	try {
		const article = tableOfContents[pageContext.routeParams.id];
		const text = await fs.readFile(
			`../../content/blog/${article.filePath}`,
			"utf8"
		);
		markdown = parseValidateAndRender(text);
	} catch (error) {
		console.log("error in onBeforeRender", error);
	} finally {
		return {
			pageContext: {
				pageProps: {
					markdown,
				},
			},
		};
	}
};
