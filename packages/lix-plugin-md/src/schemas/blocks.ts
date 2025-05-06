import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const MarkdownBlockSchemaV1 = {
	key: "lix_plugin_md_block",
	type: "json",
	schema: {
		type: "object",
		properties: {
			id: { type: "string" },
			content: { type: "string" },
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
		required: ["id", "content", "type"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
