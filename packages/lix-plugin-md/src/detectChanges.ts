import type { LixPlugin } from "@lix-js/sdk";
import { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";
import { parseMdBlocks } from "./utilities/parseMdBlocks.js";

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	const beforeBlocks = parseMdBlocks(before?.data ?? new Uint8Array());
	const afterBlocks = parseMdBlocks(after?.data ?? new Uint8Array());
	const detectedChanges = [];

	// Create maps for fast lookup
	const beforeMap = new Map(beforeBlocks.map((block) => [block.id, block]));
	const afterMap = new Map(afterBlocks.map((block) => [block.id, block]));

	// Detect deleted or modified blocks
	for (const [id, beforeBlock] of beforeMap) {
		const afterBlock = afterMap.get(id);

		if (!afterBlock) {
			// Block was removed
			detectedChanges.push({
				schema: MarkdownBlockSchemaV1,
				entity_id: id,
				snapshot: undefined,
			});
		} else if (
			beforeBlock.content !== afterBlock.content ||
			beforeBlock.type !== afterBlock.type
		) {
			// Block was modified
			detectedChanges.push({
				schema: MarkdownBlockSchemaV1,
				entity_id: id,
				snapshot: {
					text: afterBlock.content,
					type: afterBlock.type,
				},
			});
		}
	}

	// Detect newly added blocks
	for (const [id, afterBlock] of afterMap) {
		if (!beforeMap.has(id)) {
			detectedChanges.push({
				schema: MarkdownBlockSchemaV1,
				entity_id: id,
				snapshot: { text: afterBlock.content, type: afterBlock.type },
			});
		}
	}

	return detectedChanges;
};
