/**
 * This file contains custom tags that can be used in markdown
 * files. Read more on https://markdoc.dev/docs/tags.
 */

import type { Config } from "@markdoc/markdoc";
import { Callout } from "../../components/Callout.js";

/**
 * Components to be rendered for the custom tags.
 */
export const components = { Callout };

/**
 * Custom tag definitions with schema for MarkDoc.
 *
 * See https://markdoc.dev/docs/tags.
 */
export const tags: Config["tags"] = {
	callout: {
		attributes: {
			title: { type: "String" },
			type: {
				type: "String",
				matches: ["note", "warning"],
				errorLevel: "critical",
			},
		},
		render: "Callout",
	},
};
