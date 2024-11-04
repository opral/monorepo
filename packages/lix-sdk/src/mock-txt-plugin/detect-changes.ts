import type { DetectedChange, LixPlugin } from "../plugin/lix-plugin.js";

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	const detectedChanges: DetectedChange[] = [];

	const beforeTxt = before ? new TextDecoder().decode(before.data) : "";
	const afterTxt = after ? new TextDecoder().decode(after.data) : "";

	// early return if files are identical
	if (beforeTxt === afterTxt) {
		return [];
	}

	const beforeLines = beforeTxt.split("\n");
	const afterLines = afterTxt.split("\n");

	const maxLength = Math.max(beforeLines.length, afterLines.length);

	// extremly simple line-based diffing
	// which is good enough for testing purposes
	for (let i = 0; i < maxLength; i++) {
		const beforeLine = beforeLines[i];
		const afterLine = afterLines[i];

		if (beforeLine === afterLine) {
			continue;
		}

		detectedChanges.push({
			type: "line",
			entity_id: i.toString(),
			snapshot: afterLine ? { text: afterLine } : undefined,
		});
	}

	return detectedChanges;
};
