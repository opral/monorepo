import { type LixPlugin } from "@lix-js/sdk";
import { parseMdBlocks } from "./utilities/parseMdBlocks.js";
import { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";
import { MarkdownBlockPositionSchemaV1 } from "./schemas/blockPositions.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	let parsedBlocks = parseMdBlocks(file.data ?? new Uint8Array());

	// Apply changes in order: first content/type changes, then position changes
	const contentChanges = changes.filter(
		(c) => c.schema_key === MarkdownBlockSchemaV1.key,
	);
	const positionChange = changes.find(
		(c) => c.schema_key === MarkdownBlockPositionSchemaV1.key,
	);

	// Apply content changes
	for (const change of contentChanges) {
		const snapshot = await lix.db
			.selectFrom("snapshot")
			.where("id", "=", change.snapshot_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const blockId = change.entity_id;

		if (snapshot.content === null) {
			// Block deletion
			parsedBlocks = parsedBlocks.filter((block) => block.id !== blockId);
		} else {
			const updatedBlock = {
				id: blockId,
				content: snapshot.content.text,
				type: snapshot.content.type,
			};
			const index = parsedBlocks.findIndex((block) => block.id === blockId);
			if (index !== -1) {
				// Block modification
				parsedBlocks[index] = updatedBlock;
			} else {
				// Block addition - position will be handled later
				parsedBlocks.push(updatedBlock);
			}
		}
	}

	// Apply position changes
	if (positionChange) {
		const snapshot = await lix.db
			.selectFrom("snapshot")
			.where("id", "=", positionChange.snapshot_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		if (snapshot.content?.idPositions) {
			// Reorder blocks according to new positions
			const newPositions = snapshot.content.idPositions;
			const blockMap = new Map(parsedBlocks.map((block) => [block.id, block]));

			// Create new ordered array
			const orderedBlocks: Array<{
				id: string;
				content: string;
				type: string;
			}> = [];
			const positionEntries = Object.entries(newPositions).sort(
				([, a], [, b]) => (a as number) - (b as number),
			);

			for (const [id] of positionEntries) {
				const block = blockMap.get(id);
				if (block) {
					orderedBlocks.push(block);
					blockMap.delete(id);
				}
			}

			// Add any remaining blocks that weren't in the position map
			orderedBlocks.push(...Array.from(blockMap.values()));

			parsedBlocks = orderedBlocks;
		}
	}

	// Simple markdown reconstruction to match editor serialization
	const reconstructedMarkdown = parsedBlocks
		.map((block, index) => {
			const idComment = `<!-- id: ${block.id} -->`;
			const content = block.content;

			if (index === 0) {
				return `${idComment}\n${content}`;
			} else {
				// Check if content already starts with newlines
				const spacing = content.startsWith("\n") ? "\n" : "\n\n";
				return `${spacing}${idComment}\n${content}`;
			}
		})
		.join("");

	return {
		fileData: new TextEncoder().encode(reconstructedMarkdown),
	};
};
