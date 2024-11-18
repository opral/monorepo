import type { DetectedChange, LixFile, LixPlugin } from "@lix-js/sdk";
import { parseCsv } from "./utilities/parseCsv.js";
import { CellSchema } from "./schemas/cellSchema.js";

function toEntityId(rowId: string, columnName: string) {
	// row id already is <unique column>|<unique value>
	// so we can just append the column name to it
	// <unique column>|<unique value>|<column name>
	return rowId + "|" + columnName;
}

// @ts-expect-error - possibly too recursive inference
export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	// heuristic can be improved later by deriving a unique column
	const uniqueColumnBefore = before?.metadata?.unique_column;
	const uniqueColumnAfter = after?.metadata?.unique_column;

	if (uniqueColumnBefore === undefined && uniqueColumnAfter === undefined) {
		console.warn("The unique_column metadata is required to detect changes");
		return [];
	}

	const detectedChanges: DetectedChange<typeof CellSchema>[] = [];

	const [beforeParsed] = parseCsv(before?.data, uniqueColumnBefore);
	const [afterParsed] = parseCsv(after?.data, uniqueColumnAfter);

	// mark all rows as deleted and newly inserted
	// if the unique column changed
	if (uniqueColumnChanged(before, after)) {
		for (const row_id in beforeParsed) {
			for (const column in beforeParsed[row_id]) {
				const entity_id = toEntityId(row_id, column);
				// mark all cells as deleted
				detectedChanges.push({
					schema: CellSchema,
					entity_id,
					snapshot: undefined,
				});
			}
		}
		for (const row_id in afterParsed) {
			// mark all columns as newly inserted
			for (const column in afterParsed[row_id]) {
				const entity_id = toEntityId(row_id, column);
				// mark all cells as deleted
				detectedChanges.push({
					schema: CellSchema,
					entity_id,
					snapshot: { text: afterParsed[row_id]![column]! },
				});
			}
		}
		return detectedChanges;
	}

	const allRowIds = new Set([
		...Object.keys(beforeParsed ?? {}),
		...Object.keys(afterParsed ?? {}),
	]);

	// Loop over all unique IDs and detect changes at the cell level
	for (const rowId of allRowIds) {
		const beforeRow = beforeParsed?.[rowId] ?? {};
		const afterRow = afterParsed?.[rowId] ?? {};

		// Gather all unique column names for this row
		const allColumns = new Set([
			...Object.keys(beforeRow),
			...Object.keys(afterRow),
		]);

		for (const column of allColumns) {
			const beforeCell = beforeRow[column];
			const afterCell = afterRow[column];

			const entity_id = toEntityId(rowId, column);

			// Cell exists in both datasets -> check for update
			if (beforeCell !== undefined && afterCell !== undefined) {
				if (beforeCell !== afterCell) {
					detectedChanges.push({
						schema: CellSchema,
						entity_id,
						snapshot: { text: afterCell },
					});
				}
			}
			// Cell exists only in before -> delete
			else if (beforeCell !== undefined) {
				detectedChanges.push({
					schema: CellSchema,
					entity_id,
					snapshot: undefined,
				});
			}
			// Cell exists only in after -> insert
			else if (afterCell !== undefined) {
				detectedChanges.push({
					schema: CellSchema,
					entity_id,
					snapshot: { text: afterCell },
				});
			}
		}
	}

	return detectedChanges;
};

function uniqueColumnChanged(before?: LixFile, after?: LixFile) {
	return (
		// both files have a unique column
		before?.metadata?.unique_column &&
		after?.metadata?.unique_column &&
		// check if unique columns differ
		before.metadata.unique_column !== after.metadata.unique_column
	);
}
