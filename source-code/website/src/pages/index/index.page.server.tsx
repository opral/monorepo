import type { OnBeforeRender } from "@src/renderer/types.js";
import { parseValidateAndRender } from "@src/services/markdown/index.js";
import type { PageProps } from "./index.page.jsx";
import fs from "node:fs";
import { marked } from "marked";

const text = fs.readFileSync(`../../README.md`, "utf-8");
const markdown = marked.parse(text);

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async () => {
	return {
		pageContext: {
			pageProps: {
				markdown: markdown,
			},
		},
	};
};
