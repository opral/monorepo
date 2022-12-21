import type { Config } from "@markdoc/markdoc";
import { icons } from "@src/components/Icon.jsx";
import { Callout } from "./Callout.jsx";
import { Fence } from "./Fence.jsx";
import { Figure } from "./Figure.jsx";
import { QuickLink, QuickLinks } from "./QuickLinks.jsx";
import type { SemanticColorTokens } from "../../../../tailwind.config.cjs";

/**
 * The components that render custom nodes or tags
 */
export const components = {
	Callout,
	Fence,
	Figure,
	QuickLink,
	QuickLinks,
};

/**
 * The Markdoc configuration.
 */
export const config: Config = {
	nodes: {
		fence: {
			render: "Fence",
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
				variant: {
					type: "String",
					matches: [
						"info",
						"success",
						"warning",
						"danger",
					] satisfies SemanticColorTokens,
					errorLevel: "error",
				},
			},
			render: "Callout",
		},
		Figure: {
			selfClosing: true,
			attributes: {
				src: { type: "String" },
				alt: { type: "String" },
				caption: { type: "String" },
			},
			render: "Figure",
		},
		QuickLinks: {
			render: "QuickLinks",
		},
		QuickLink: {
			selfClosing: true,
			render: "QuickLink",
			attributes: {
				title: { type: "String" },
				description: { type: "String" },
				icon: { type: "String", matches: Object.keys(icons) },
				href: { type: "String" },
			},
		},
	},
};
