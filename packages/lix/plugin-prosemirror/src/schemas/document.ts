import type { LixSchemaDefinition } from "@lix-js/sdk";

/**
 * Metadata entity describing the persisted ProseMirror document order.
 *
 * @example
 *   {
 *     "_id": "document-root",
 *     "type": "document",
 *     "children_order": ["p1", "p2"]
 *   }
 */
export interface ProsemirrorDocument {
	_id: string;
	type: "document";
	children_order: string[];
}

/**
 * JSON schema for the persisted ProseMirror document entity.
 */
export const ProsemirrorDocumentSchema: LixSchemaDefinition = {
	"x-lix-key": "prosemirror_document",
	"x-lix-version": "1.0",
	type: "object",
	additionalProperties: false,
	required: ["_id", "type", "children_order"],
	properties: {
		_id: {
			type: "string",
			description:
				"Stable identifier for the document entity. The value is typically `document-root`.",
		},
		type: {
			type: "string",
			const: "document",
			description:
				"Discriminator indicating this entity represents the document.",
		},
		children_order: {
			type: "array",
			description: "Ordered list of top-level node IDs in the document.",
			items: {
				type: "string",
			},
		},
	},
};
