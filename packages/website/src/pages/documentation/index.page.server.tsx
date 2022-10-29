/**
 * Only runs server-side to pre-fetch data.
 *
 * To enable client side rendering, the markdown
 * parsing function needs to render the resulting react
 * component as a string, and then hyrdrate client-side.
 */

import type { PageContext } from "@src/renderer/types.js";
import { parseValidateAndRender } from "@src/services/markdoc/parseValidateAndRender.js";
import fs from "node:fs/promises";

export async function onBeforeRender(pageContext: PageContext) {
	const text = await fs.readFile(
		"../../documentation/getting-started.md",
		"utf-8"
	);
	const markdown = parseValidateAndRender(text);
	return {
		pageContext: {
			pageProps: {
				markdown,
			},
		},
	};
}

type PageProps = {
	markdown: string;
};

export function Page(props: PageProps) {
	return <div className="p-10">{props.markdown}</div>;
}
