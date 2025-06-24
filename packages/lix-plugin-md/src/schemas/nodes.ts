import type { LixSchemaDefinition } from "@lix-js/sdk";

export const MarkdownNodeSchemaV1 = {
	"x-lix-key": "lix_plugin_md_node",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		mdast_id: { type: "string" },
		type: { 
			type: "string",
			enum: [
				"paragraph", "heading", "list", "listItem", "code", 
				"blockquote", "table", "tableRow", "tableCell",
				"thematicBreak", "html", "image", "link", "emphasis", "strong",
				"delete", "inlineCode", "break", "text", "yaml", "toml",
				// Additional GFM types
				"tableHead", "tableBody", "footnote", "footnoteDefinition",
				"footnoteReference"
			]
		},
		children: { 
			type: "array",
			items: { 
				type: "object",
				properties: {
					mdast_id: { type: "string" },
					type: { type: "string" }
				},
				additionalProperties: true
			}
		},
		// Common properties
		value: { type: "string" },      // For text, code, html nodes
		depth: { type: "number" },      // For heading nodes
		ordered: { type: "boolean" },   // For list nodes
		url: { type: "string" },        // For link, image nodes
		alt: { type: "string" },        // For image nodes
		title: { type: "string" },      // For link, image nodes
		lang: { type: "string" },       // For code nodes
		meta: { type: "string" },       // For code nodes
		// Table properties
		align: { 
			type: "array",
			items: { 
				type: "string",
				enum: ["left", "right", "center", null]
			}
		},
		// Position information
		position: {
			type: "object",
			properties: {
				start: {
					type: "object",
					properties: {
						line: { type: "number" },
						column: { type: "number" },
						offset: { type: "number" }
					}
				},
				end: {
					type: "object",
					properties: {
						line: { type: "number" },
						column: { type: "number" },
						offset: { type: "number" }
					}
				}
			}
		}
	},
	required: ["mdast_id", "type"],
	additionalProperties: true
} as const satisfies LixSchemaDefinition;