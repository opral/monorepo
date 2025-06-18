import type { LixSchemaDefinition } from "@lix-js/sdk";

export const MarkdownBlockSchemaV1 = {
	"x-lix-key": "lix_plugin_md_block",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		id: { type: "string" },
		text: { type: "string" },
		type: {
			type: "string",
			enum: [
				"paragraph",
				"heading",
				"list",
				"code",
				"blockquote",
				"table",
				"hr",
				"html",
				"fenced_code",
				"image",
				"link",
				"footnote",
			],
		},
	},
	required: ["id", "text", "type"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
