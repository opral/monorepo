import type { LixPlugin } from "@lix-js/sdk";
import { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";
import { parseMdBlocks } from "./utilities/parseMdBlocks.js";
import { MarkdownBlockPositionSchemaV1 } from "./schemas/blockPositions.js";

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

	const idPositionsBefore = Object.fromEntries(
		beforeBlocks.map((block, index) => [block.id, index]),
	);
	const idPositionsAfter = Object.fromEntries(
		afterBlocks.map((block, index) => [block.id, index]),
	);

	if (JSON.stringify(idPositionsBefore) !== JSON.stringify(idPositionsAfter)) {
		detectedChanges.push({
			schema: MarkdownBlockPositionSchemaV1,
			entity_id: "block_positions",
			snapshot: {
				idPositions: Object.fromEntries(
					afterBlocks.map((block, index) => [block.id, index]),
				),
			},
		});
	}

	return detectedChanges;
};
