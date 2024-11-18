import type { DetectedChange, LixPlugin } from "@lix-js/sdk";
import { CellSchema } from "./schemas/cell.js";
import { HeaderSchema } from "./schemas/header.js";
import { parseCsv } from "./utilities/parseCsv.js";
import { RowSchema } from "./schemas/row.js";

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

	const detectedChanges: DetectedChange<
		typeof CellSchema | typeof HeaderSchema | typeof RowSchema
	>[] = [];

	const beforeParsed = parseCsv(before?.data, uniqueColumnBefore);
	const afterParsed = parseCsv(after?.data, uniqueColumnAfter);

	const headerChanged = checkHeaderChange(
		beforeParsed.header,
		afterParsed.header,
	);

	if (headerChanged) {
		detectedChanges.push({
			schema: HeaderSchema,
			entity_id: "header",
			snapshot: {
				columnNames: afterParsed.header,
			},
		});
	}

	// detect row and cell changes

	const allRowIds = new Set([
		...beforeParsed.index.keys(),
		...afterParsed.index.keys(),
	]);

	// Loop over all unique IDs and detect changes at the cell level
	for (const rowId of allRowIds) {
		const beforeRow = beforeParsed.index.get(rowId) ?? {};
		const afterRow = afterParsed.index.get(rowId) ?? {};

		const rowLineNumberBefore = beforeParsed.lineNumbers[rowId];
		const rowLineNumberAfter = afterParsed.lineNumbers[rowId];

		if (rowLineNumberBefore !== rowLineNumberAfter) {
			detectedChanges.push({
				schema: RowSchema,
				entity_id: rowId,
				// if the row was deleted, snapshot is undefined
				snapshot:
					rowLineNumberAfter === undefined
						? undefined
						: { lineNumber: rowLineNumberAfter },
			});
		}

		// Gather all column names for this row
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

function checkHeaderChange(before?: string[], after?: string[]) {
	const beforeHeaderRow = before?.join(",");
	const afterHeaderRow = after?.join(",");
	return beforeHeaderRow !== afterHeaderRow;
}
