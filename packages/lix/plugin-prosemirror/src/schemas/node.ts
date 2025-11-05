import type { LixSchemaDefinition } from "@lix-js/sdk";

/**
 * Arbitrary attributes attached to a ProseMirror node.
 *
 * @example
 *   { "id": "heading-1", "level": 2 }
 */
export interface ProsemirrorNodeAttributes {
	id?: string;
	[key: string]: unknown;
}

/**
 * ProseMirror mark representation.
 *
 * @example
 *   { "type": "strong" }
 */
export interface ProsemirrorNodeMark {
	type: string;
	attrs?: ProsemirrorNodeAttributes;
}

/**
 * JSON representation of a ProseMirror node that can be persisted by Lix.
 *
 * @example
 *   {
 *     "type": "paragraph",
 *     "attrs": { "id": "p1" },
 *     "content": [{ "type": "text", "text": "Hello" }]
 *   }
 */
export interface ProsemirrorNode {
	type: string;
	_id?: string;
	content?: ProsemirrorNode[];
	text?: string;
	attrs?: ProsemirrorNodeAttributes;
	marks?: ProsemirrorNodeMark[];
}

/**
 * JSON schema describing persisted ProseMirror nodes.
 */
export const ProsemirrorNodeSchema: LixSchemaDefinition = {
	"x-lix-key": "prosemirror_node",
	"x-lix-version": "1.0",
	type: "object",
	additionalProperties: false,
	required: ["type"],
	properties: {
		type: {
			type: "string",
			description: "ProseMirror node type identifier (e.g. paragraph, heading).",
		},
		_id: {
			type: "string",
			description:
				"Legacy field for node identifiers. Prefer using attrs.id when possible.",
		},
		text: {
			type: "string",
			description: "Text content for leaf nodes.",
		},
		content: {
			type: "array",
			description: "Child nodes contained within this node.",
			items: {
				$ref: "#",
			},
		},
		attrs: {
			type: "object",
			description: "Arbitrary attributes associated with the node.",
			additionalProperties: true,
			properties: {
				id: {
					type: "string",
					description:
						"Preferred location for the stable node identifier used by the plugin.",
				},
			},
		},
		marks: {
			type: "array",
			description: "Formatting marks applied to text contained in the node.",
			items: {
				type: "object",
				required: ["type"],
				additionalProperties: false,
				properties: {
					type: {
						type: "string",
					},
					attrs: {
						type: "object",
						additionalProperties: true,
						properties: {
							id: {
								type: "string",
							},
						},
					},
				},
			},
		},
	},
};
