import type { LixPlugin } from "@lix-js/sdk";
import { TextSchemaV1 } from "./schemas/text.js";
export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	const beforeText = new TextDecoder().decode(before?.data ?? new Uint8Array());
	const afterText = new TextDecoder().decode(after?.data ?? new Uint8Array());
	const detectedChanges = [];

	if (beforeText !== afterText) {
		detectedChanges.push({
			schema: TextSchemaV1,
			entity_id: (after?.path ?? before?.path) + "content",
			snapshot: afterText,
		});
	}

	return detectedChanges;
};
