import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeRewrite from "rehype-rewrite"
import addClasses from "rehype-class-names"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import { preprocess } from "./preprocess.js"

/* Converts the markdown with remark and the html with rehype to be suitable for being rendered */
export async function convert(markdown: string): Promise<string> {
	const content = await unified()
		/* @ts-ignore */
		.use(remarkParse)
		/* @ts-ignore */
		.use(remarkGfm)
		/* @ts-ignore */
		.use(remarkRehype, { allowDangerousHtml: true })
		/* @ts-ignore */
		.use(rehypeRaw)
		/* @ts-ignore */
		.use(rehypeSanitize, {
			tagNames: [
				"doc-figure",
				"doc-link",
				"doc-copy",
				"doc-links",
				"doc-icon",
				"doc-slider",
				"doc-comment",
				"doc-comments",
				"doc-proof",
				"doc-feature",
				"doc-features",
				"inlang-badge-generator",
				"doc-accordion",
				"doc-header",
				"doc-image",
				"doc-pricing",
				"doc-important",
				"doc-video",
				...(defaultSchema.tagNames ?? []),
			],
			attributes: {
				"doc-figure": ["src", "alt", "caption"],
				"doc-link": ["href", "description", "title", "icon"],
				"doc-comment": ["author", "text", "icon"],
				"doc-feature": ["name", "icon", "image", "color", "text-color"],
				"doc-proof": ["organisations"],
				"doc-slider": ["items"],
				"doc-icon": ["icon", "size"],
				"doc-accordion": ["heading", "text"],
				"doc-header": ["title", "description", "button", "link"],
				"doc-image": ["src", "alt"],
				"doc-important": ["title", "description"],
				"doc-pricing": ["heading", "content"],
				"doc-video": ["src", "type"],
				...defaultSchema.attributes,
			},
		})
		.use(rehypeHighlight)
		.use(rehypeSlug)
		/* @ts-ignore */
		.use(addClasses, {
			"h1,h2,h3,h4,h5,h6":
				"doc-font-semibold doc-leading-relaxed doc-relative doc-my-6 doc-cursor-pointer doc-group/heading doc-no-underline",
			h1: "doc-text-3xl doc-pb-3 doc-mb-2 doc-mt-12",
			h2: "doc-text-2xl doc-pb-3 doc-mb-1 doc-mt-10",
			h3: "doc-text-xl doc-mt-10 doc-pb-0 doc-mb-0",
			h4: "doc-text-lg",
			h5: "doc-text-lg",
			h6: "doc-text-base",
			p: "doc-text-base text-surface-600 doc-my-4 doc-leading-relaxed",
			a: "text-primary doc-font-medium hover:text-hover-primary doc-no-underline doc-inline-block",
			code: "doc-px-1 doc-py-0.5 doc-bg-surface-100 doc-rounded-lg bg-surface-200 doc-my-6 doc-text-sm doc-font-mono text-surface-900",
			pre: "doc-relative",
			ul: "doc-list-disc doc-list-inside doc-space-y-3 pl-6",
			ol: "doc-list-decimal doc-list-inside doc-space-y-3 pl-6",
			li: "doc-list-outside",
			table:
				"doc-table-auto doc-w-full doc-my-6 doc-rounded-xl doc-text-left doc-max-w-[100%] doc-overflow-x-scroll",
			thead: "doc-font-medium pb-2 doc-border-b doc-border-surface-2 doc-text-left",
			th: "doc-py-2 doc-font-medium doc-border-b doc-border-surface-2 doc-truncate",
			tr: "doc-py-2 doc-border-b border-surface-2",
			td: "doc-py-2 doc-leading-7",
			hr: "doc-my-6 doc-border-b border-surface-200",
			img: "doc-mx-auto doc-my-4 doc-rounded",
			strong: "doc-font-bold",
		})
		/* @ts-ignore */
		.use(rehypeAutolinkHeadings, {
			behavior: "wrap",
			properties: {
				onclick: `event.preventDefault(); window.scrollTo({top: document.getElementById(event.target.hash.substring(1)).offsetTop - 96, behavior: "smooth"}); window.history.pushState(null, null, event.target.hash);`,
			},
		})
		/* @ts-ignore */
		.use(rehypeRewrite, {
			rewrite: (node: any) => {
				if (
					node.tagName === "h1" ||
					node.tagName === "h2" ||
					node.tagName === "h3" ||
					node.tagName === "h4" ||
					node.tagName === "h5" ||
					node.tagName === "h6"
				) {
					if (node.type === "element") {
						node.children = [
							{
								type: "element",
								tagName: "span",
								properties: {
									className:
										"doc-font-medium doc-hidden md:doc-block doc-mr-2 text-primary doc-opacity-0 group-hover/heading:doc-opacity-100 transition-opacity doc-absolute " +
										(node.tagName === "h1"
											? "-doc-left-6"
											: node.tagName === "h2"
											? "-doc-left-5"
											: node.tagName === "h3"
											? "-doc-left-4"
											: "-doc-left-3"),
								},
								children: [{ type: "text", value: "#" }],
							},
							...node.children,
						]
					}
				} else if (
					node.tagName === "pre" &&
					!node.children[0].properties.className.includes("language-mermaid")
				) {
					node.children = [
						{
							type: "element",
							tagName: "doc-copy",
							properties: {
								className: "doc-absolute doc-right-3 doc-top-3 doc-font-sans text-sm",
							},
						},
						...node.children,
					]
				} else if (
					node.tagName === "pre" &&
					node.children[0].properties.className.includes("language-mermaid")
				) {
					node.tagName = "div"
					node.children = []
				} else if (
					node.tagName === "a" &&
					node.properties.href &&
					node.properties.href.startsWith("http") &&
					node.children[0].tagName !== "img"
				) {
					;(node.children = [
						...node.children,
						{
							type: "element",
							tagName: "doc-icon",
							properties: {
								className: "relative doc-ml-1 doc-top-[3px]",
								icon: "material-symbols:arrow-outward",
								size: "1.2em",
							},
						},
					]),
						(node.properties.target = "_blank")
				} else if (
					node.tagName === "a" &&
					node.properties.href &&
					node.properties.href.startsWith("http") &&
					node.children[0].tagName === "img"
				) {
					node.properties.target = "_blank"
				}
			},
		})
		/* @ts-ignore */
		.use(rehypeAccessibleEmojis)
		/* @ts-ignore */
		.use(rehypeStringify)
		.process(preprocess(markdown))

	return String(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark-dimmed.min.css">
	${content}`)
}
