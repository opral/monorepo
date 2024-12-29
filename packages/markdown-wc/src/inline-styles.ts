import { visit } from "unist-util-visit"

export const rehypeInlineStyles = (styleMap: any) => {
	return () => (tree: any) => {
		visit(tree, "element", (node) => {
			// Check if the tagName matches the styleMap keys
			if (node.tagName in styleMap) {
				// Retrieve the styles for this tag
				const styles = styleMap[node.tagName]

				// Merge existing styles if any
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
		"border-radius": "0.375rem",
		margin: "1.5rem 0",
		"font-size": "0.875rem",
		"font-family": "monospace",
	},
	pre: {
		position: "relative",
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
		overflow: "auto",
	},
	thead: {
		"font-weight": "500",
		"padding-bottom": "0.5rem",
		"border-bottom": "1px solid inherit",
		"text-align": "left",
	},
	th: {
		padding: "0.5rem 0",
		"font-weight": "500",
		"border-bottom": "1px solid inherit",
		"white-space": "nowrap",
	},
	tr: {
		padding: "0.5rem 0",
		"border-bottom": "1px solid inherit",
	},
	td: {
		padding: "0.5rem 0",
		"line-height": "1.75",
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
