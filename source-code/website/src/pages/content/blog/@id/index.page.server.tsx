import type { OnBeforeRender } from "@src/renderer/types.js";
import { parseValidateAndRender } from "@src/services/markdown/parseValidateAndRender.js";
import type { PageProps } from "./index.page.jsx";

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (
	pageContext
) => {
	const fs = await import("node:fs/promises");
	let markdown: string | undefined;
	try {
		const text = await fs.readFile(
			`../../blog/${pageContext.routeParams.id}.md`,
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
