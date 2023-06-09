import type { Config } from "@markdoc/markdoc"
import type { SemanticColorTokens } from "../../../../tailwind.config.cjs"
import { icons } from "../../../components/Icon.jsx"
import { Fence } from "./nodes/Fence.jsx"
import { Heading } from "./nodes/Heading.jsx"
import { Callout } from "./tags/Callout.jsx"
import { Figure } from "./tags/Figure.jsx"
import { QuickLink, QuickLinks } from "./tags/QuickLinks.jsx"
import { Link } from "./nodes/Link.jsx"
import { Document } from "./nodes/Document.jsx"
import { Video } from "./tags/Video.jsx"
import { Registry } from "./tags/Registry.jsx"

/**
 * The components that render custom nodes or tags
 */
export const components = {
	Callout,
	Fence,
	Figure,
	QuickLink,
	QuickLinks,
	Link,
	Heading,
	Document,
	Video,
	Registry,
}

/**
 * The Markdoc configuration.
 */
export const config: Config = {
	/**
	 * Custom nodes for Markdoc.
	 *
	 * See https://markdoc.dev/docs/nodes
	 */
	nodes: {
		document: {
			render: "Document",
			attributes: {
				frontmatter: {
					type: "String",
				},
			},
		},
		fence: {
			render: "Fence",
			attributes: {
				language: {
					type: "String",
				},
				content: {
					required: true,
					type: "String",
				},
			},
		},
		link: {
			render: "Link",
			attributes: {
				href: {
					required: true,
					type: "String",
				},
			},
		},
		heading: {
			render: "Heading",
			attributes: {
				level: {
					required: true,
					type: "Number",
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
					matches: ["info", "success", "warning", "danger"] satisfies SemanticColorTokens,
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
				height: { type: "String" },
				width: { type: "String" },
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
		Video: {
			selfClosing: true,
			render: "Video",
			attributes: {
				src: { type: "String", required: true },
			},
		},
		Registry: {
			render: "Registry",
		},
	},
}
