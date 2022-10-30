import fs from "node:fs/promises";
import { parseValidateAndRender } from "@src/services/markdoc/parseValidateAndRender.js";

export async function onBeforeRender() {
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
	return <div innerHTML={props.markdown}></div>;
}
