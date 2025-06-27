import type { LixSchemaDefinition } from "@lix-js/sdk";

export interface ProsemirrorDocument {
	_id: string;
	type: "document";
	children_order: string[];
}

export const ProsemirrorDocumentSchema: LixSchemaDefinition = {
	"x-lix-key": "prosemirror_document",
	"x-lix-version": "1.0",
	type: "object",
};