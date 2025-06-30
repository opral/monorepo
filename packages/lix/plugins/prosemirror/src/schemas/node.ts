import type { LixSchemaDefinition } from "@lix-js/sdk";

export interface ProsemirrorNode {
	type: string;
	_id?: string;
	content?: ProsemirrorNode[];
	text?: string;
	attrs?: Record<string, any>;
	marks?: Array<{
		type: string;
		attrs?: Record<string, any>;
	}>;
	[key: string]: any;
}

export const ProsemirrorNodeSchema: LixSchemaDefinition = {
	"x-lix-key": "prosemirror_node",
	"x-lix-version": "1.0",
	type: "object",
};
