import type { Config } from "@markdoc/markdoc";
import { Callout } from "./Callout.jsx";

/**
 * The components that render custom tags
 */
export const components = {
	Callout,
};

/**
 * Custom tags for MarkDoc.
 *
 * See https://markdoc.dev/docs/tags.
 */
export const tags: Config["tags"] = {
	Callout: {
		attributes: {
			title: { type: "String" },
			variant: {
				type: "String",
				matches: ["success", "info", "warning", "danger"],
				errorLevel: "error",
			},
		},
		render: "Callout",
	},
};
