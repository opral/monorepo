import type { Config } from "@markdoc/markdoc";

/**
 * Custom tags for MarkDoc.
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
