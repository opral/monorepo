import type { DetectedChange, LixFile, LixPlugin } from "@lix-js/sdk";
import { parseCsv } from "./utilities/parseCsv.js";

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	// heuristic can be improved later by deriving a unique column
	const uniqueColumnBefore = before?.metadata?.unique_column;
	const uniqueColumnAfter = after?.metadata?.unique_column;

	if (uniqueColumnBefore === undefined && uniqueColumnAfter === undefined) {
		throw new Error("The unique_column metadata is required to detect changes");
	}

	const detectedChanges: DetectedChange[] = [];

	const [beforeParsed] = parseCsv(before?.data, uniqueColumnBefore);
	const [afterParsed] = parseCsv(after?.data, uniqueColumnAfter);

	const allEntityIds = new Set([
		...Object.keys(beforeParsed ?? {}),
		...Object.keys(afterParsed ?? {}),
	]);

	// mark all rows as deleted and newly inserted
	// if the unique column changed
	if (uniqueColumnChanged(before, after)) {
		for (const entity_id in beforeParsed) {
			// mark all rows as deleted
			detectedChanges.push({
				type: "row",
				entity_id,
				snapshot: undefined,
			});
		}
		for (const entity_id in afterParsed) {
			// mark all rows as newly inserted
			detectedChanges.push({
				type: "row",
				entity_id,
				snapshot: afterParsed[entity_id],
			});
		}
		return detectedChanges;
	}

	// Loop over all unique IDs and detect changes
	for (const entity_id of allEntityIds) {
		const beforeRow = beforeParsed?.[entity_id];
		const afterRow = afterParsed?.[entity_id];

		// Row exists in both datasets -> check for update
		if (beforeRow && afterRow) {
			if (!isEqual(beforeRow, afterRow)) {
				detectedChanges.push({
					type: "row",
					entity_id,
					snapshot: afterRow,
				});
			}
		}
		// Row exists only in before -> delete
		else if (beforeRow) {
			detectedChanges.push({
				type: "row",
				entity_id,
				snapshot: undefined,
			});
		}
		// Row exists only in after -> insert
		else if (afterRow) {
			detectedChanges.push({
				type: "row",
				entity_id,
				snapshot: afterRow,
			});
		}
	}
	return detectedChanges;
};

function isEqual(rowA: string[], rowB: string[]): boolean {
	return rowA.join() === rowB.join();
}

function uniqueColumnChanged(before?: LixFile, after?: LixFile) {
	return (
		// both files have a unique column
		before?.metadata?.unique_column &&
		after?.metadata?.unique_column &&
		// check if unique columns differ
		before.metadata.unique_column !== after.metadata.unique_column
	);
}
