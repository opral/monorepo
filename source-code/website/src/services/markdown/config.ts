import type * as markdoc from "@markdoc/markdoc";
import { Callout } from "./components/Callout.jsx";
import { SyntaxHighlight } from "./components/SyntaxHighlight.jsx";

/**
 * The components that render custom nodes or tags
 */
export const components = {
	Callout,
	SyntaxHighlight,
};

export const config: markdoc.Config = {
	nodes: {
		fence: {
			render: "SyntaxHighlight",
			attributes: {
				language: {
					type: "String",
				},
				content: {
					type: "String",
				},
			},
		},
	},
	/**
	 * Custom tags for MarkDoc.
	 *
	 * See https://markdoc.dev/docs/tags.
	 */
	tags: {
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
	},
};
