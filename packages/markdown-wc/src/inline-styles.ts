import { visit } from "unist-util-visit"

export const rehypeInlineStyles = (styleMap: any) => {
	return () => (tree: any) => {
		// Create a style element for pseudo-selectors
		const styleNode = {
			type: "element",
			tagName: "style",
			properties: {},
			children: [
				{
					type: "text",
					value: Object.entries(styleMap)
						.filter(([key]) => key.includes(":"))
						.map(
							([key, styles]) =>
								`${key} { ${Object.entries(styles as any)
									.map(([k, v]) => `${k}: ${v};`)
									.join(" ")} }`
						)
						.join("\n"),
				},
			],
		}

		// Add the style node to the head of the document
		if (tree.children.length > 0) {
			tree.children.unshift(styleNode)
		}

		visit(tree, "element", (node) => {
			// Special handling for code elements
			if (node.tagName === "code") {
				// Skip styling if:
				// 1. Inside a pre tag OR
				// 2. Has a syntax highlighting class (starts with 'hljs' or 'language-')
				const isInPre = node.parent?.tagName === "pre"
				const hasHighlightClass = node.properties.className?.some(
					(cls: string) => cls.startsWith("hljs") || cls.startsWith("language-")
				)

				if (!isInPre && !hasHighlightClass) {
					const inlineCodeStyles = styleMap["inlineCode"] || {}
					const existingStyles = node.properties.style || ""
					const newStyles = Object.entries(inlineCodeStyles)
						.map(([key, value]) => `${key}: ${value};`)
						.join(" ")
					node.properties.style = `${existingStyles} ${newStyles}`.trim()
				}
				return
			}

			// Regular style handling for other elements (excluding pseudo-selectors)
			const tagName = node.tagName
			if (tagName in styleMap && !tagName.includes(":")) {
				const styles = styleMap[tagName]
				const existingStyles = node.properties.style || ""
				const newStyles = Object.entries(styles)
					.map(([key, value]) => `${key}: ${value};`)
					.join(" ")
				node.properties.style = `${existingStyles} ${newStyles}`.trim()
			}
		})
	}
}

export const defaultInlineStyles = {
	h1: {
		"font-weight": "600",
		"line-height": "1.625",
		position: "relative",
		margin: "1.5rem 0",
		cursor: "pointer",
		"text-decoration": "none",
		"font-size": "1.875rem",
	},
	h2: {
		"font-weight": "600",
		"line-height": "1.625",
		position: "relative",
		margin: "1.5rem 0",
		cursor: "pointer",
		"text-decoration": "none",
		"font-size": "1.5rem",
	},
	h3: {
		"font-weight": "600",
		"line-height": "1.625",
		position: "relative",
		margin: "1.5rem 0",
		cursor: "pointer",
		"text-decoration": "none",
		"font-size": "1.25rem",
	},
	h4: {
		"font-weight": "600",
		"line-height": "1.625",
		position: "relative",
		margin: "1.5rem 0",
		cursor: "pointer",
		"text-decoration": "none",
		"font-size": "1.125rem",
	},
	h5: {
		"font-weight": "600",
		"line-height": "1.625",
		position: "relative",
		margin: "1.5rem 0",
		cursor: "pointer",
		"text-decoration": "none",
		"font-size": "1.125rem",
	},
	h6: {
		"font-weight": "600",
		"line-height": "1.625",
		position: "relative",
		margin: "1.5rem 0",
		cursor: "pointer",
		"text-decoration": "none",
		"font-size": "1rem",
	},
	p: {
		"font-size": "1rem",
		margin: "1rem 0",
		"line-height": "1.625",
	},
	a: {
		"font-weight": "500",
		"text-decoration": "none",
		display: "inline-block",
	},
	code: {
		"font-family": "monospace",
		"font-size": "0.875rem",
		"border-radius": "0.375rem",
		padding: "1rem",
		margin: "1.5rem 0",
	},
	inlineCode: {
		"background-color": "rgba(175, 184, 193, 0.2)",
		"border-radius": "0.375rem",
		padding: "0.2em 0.4em",
		margin: "0",
		"font-family": "monospace",
		"font-size": "0.875rem",
	},
	pre: {
		position: "relative",
		"font-size": "0.875rem",
		"border-radius": "0.375rem",
		overflow: "hidden",
	},
	ul: {
		"list-style-type": "disc",
		"list-style-position": "inside",
		"margin-bottom": "0.75rem",
		"padding-left": "1.5rem",
	},
	ol: {
		"list-style-type": "decimal",
		"list-style-position": "inside",
		"margin-bottom": "0.75rem",
		"padding-left": "1.5rem",
	},
	li: {
		"list-style-position": "outside",
	},
	table: {
		"table-layout": "auto",
		width: "100%",
		margin: "1.5rem 0",
		"border-radius": "0.75rem",
		"text-align": "left",
		"max-width": "100%",
		overflow: "hidden",
		"border-collapse": "separate",
		"border-spacing": "0",
		border: "1px solid #e2e8f0",
	},
	thead: {
		"font-weight": "500",
		"padding-bottom": "0.5rem",
		"text-align": "left",
		"background-color": "#f8fafc",
	},
	"thead tr:first-child th:first-child": {
		"border-top-left-radius": "0.75rem",
	},
	"thead tr:first-child th:last-child": {
		"border-top-right-radius": "0.75rem",
		"border-right": "none",
	},
	"tbody tr:last-child td:first-child": {
		"border-bottom-left-radius": "0.75rem",
	},
	"tbody tr:last-child td:last-child": {
		"border-bottom-right-radius": "0.75rem",
		"border-right": "none",
	},
	th: {
		padding: "0.75rem 1rem",
		"font-weight": "600",
		"border-bottom": "1px solid #e2e8f0",
		"white-space": "nowrap",
		"border-right": "1px solid #e2e8f0",
	},
	tr: {
		"border-bottom": "1px solid #e2e8f0",
	},
	"tr:last-child": {
		"border-bottom": "none",
	},
	td: {
		padding: "0.75rem 1rem",
		"line-height": "1.75",
		"border-right": "1px solid #e2e8f0",
		"vertical-align": "middle",
	},
	hr: {
		margin: "1.5rem 0",
		"border-bottom": "1px solid inherit",
	},
	img: {
		margin: "1rem auto",
		"border-radius": "0.375rem",
	},
	strong: {
		"font-weight": "700",
	},
}
