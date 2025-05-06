import { type LixPlugin } from "@lix-js/sdk";
import { parseMdBlocks } from "./utilities/parseMdBlocks.js";
import { MarkdownBlockSchemaV1 } from "./schemas/blocks.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	let parsedBlocks = parseMdBlocks(file.data ?? new Uint8Array());

	for (const change of changes) {
		if (change.schema_key === MarkdownBlockSchemaV1.key) {
			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", change.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			const blockId = change.entity_id;

			if (snapshot.content === null) {
				parsedBlocks = parsedBlocks.filter((block) => block.id !== blockId);
			} else {
				const updatedBlock = {
					id: blockId,
					content: snapshot.content.text,
					type: snapshot.content.type,
				};
				const index = parsedBlocks.findIndex((block) => block.id === blockId);
				if (index !== -1) {
					parsedBlocks[index] = updatedBlock;
				} else {
					parsedBlocks.push(updatedBlock);
				}
			}
		}
	}

	return {
		fileData: new TextEncoder().encode(
			parsedBlocks
				.map((block) => {
					return block.content === "<br>"
						? "<!-- id: " + block.id + " -->" + block.content
						: "<!-- id: " + block.id + " -->\n" + block.content;
				})
				.join("\n\n"),
		),
	};
};
