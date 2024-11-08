import {
	resolveConflictWithNewChange,
	type DetectedChange,
	type LixFile,
	type LixPlugin,
} from "@lix-js/sdk";
import { parseCsv } from "./utilities/parseCsv.js";

function toEntityId(rowId: string, columnName: string) {
	// row id already is <unique column>|<unique value>
	// so we can just append the column name to it
	// <unique column>|<unique value>|<column name>
	return rowId + "|" + columnName;
}

export type DetectedSchemaDefinitionChange = Omit<
	DetectedChange,
	"snaphot" | "type" | "entity_id"
> & {
	entity_id: "schema";
	type: "csv-v2-schema";
	snapshot?: {
		columnNames: string[];
	} | null;
};

export type DetectedRowChange = Omit<DetectedChange, "snaphot" | "type"> & {
	type: "csv-v2-row";
	snapshot?: {
		rowIndex: number;
		rowEntities: string[];
	} | null;
};

export type DetectedCellChange = Omit<DetectedChange, "snaphot" | "type"> & {
	type: "csv-v2-cell";
	snapshot?: {
		text: string;
	} | null;
};

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

	const detectedSchemaDefChanges: DetectedSchemaDefinitionChange[] = [];
	const detectedRowChanges: DetectedRowChange[] = [];
	const detectedCellChanges: DetectedCellChange[] = [];

	const beforeParsed = before
		? parseCsv(before?.data, uniqueColumnBefore)
		: undefined;
	const afterParsed = after
		? parseCsv(after?.data, uniqueColumnAfter)
		: undefined;

	if (
		afterParsed &&
		(!beforeParsed ||
			stringArraysDiffer(afterParsed.headerRow, beforeParsed.headerRow))
	) {
		detectedSchemaDefChanges.push({
			entity_id: "schema",
			type: "csv-v2-schema",
			snapshot: {
				columnNames: afterParsed.headerRow,
			},
		});
	} else if (!afterParsed && beforeParsed) {
		detectedSchemaDefChanges.push({
			entity_id: "schema",
			type: "csv-v2-schema",
			snapshot: null,
		});
	}

	// mark all rows as deleted and newly inserted
	// if the unique column changed
	if (uniqueColumnChanged(before, after)) {
		for (const row_id in beforeParsed?.recordsById) {
			for (const column in beforeParsed.recordsById[row_id]) {
				const entity_id = toEntityId(row_id, column);
				// mark all cells as deleted
				detectedCellChanges.push({
					type: "csv-v2-cell",
					entity_id,
					snapshot: null,
				});
			}
			detectedRowChanges.push({
				entity_id: row_id,
				type: "csv-v2-row",
				snapshot: null,
			});
		}
		let currentRowIndex = 0;
		for (const row_id in afterParsed?.recordsById) {
			const rowEntities = [];
			// mark all columns as newly inserted
			for (const column in afterParsed.recordsById[row_id]) {
				const entity_id = toEntityId(row_id, column);
				// mark all cells as deleted
				detectedCellChanges.push({
					type: "csv-v2-cell",
					entity_id,
					snapshot: { text: afterParsed.recordsById[row_id]![column]! },
				});
				rowEntities.push(entity_id);
			}
			detectedRowChanges.push({
				entity_id: row_id,
				type: "csv-v2-row",
				snapshot: {
					rowIndex: currentRowIndex,
					rowEntities: rowEntities.sort(),
				},
			});
			currentRowIndex += 1;
		}
		return [
			...detectedSchemaDefChanges,
			...detectedRowChanges,
			...detectedCellChanges,
		];
	}

	const allRowIds = new Set([
		...Object.keys(beforeParsed?.recordsById ?? {}),
		...Object.keys(afterParsed?.recordsById ?? {}),
	]);

	// Loop over all unique IDs and detect changes at the cell level
	for (const rowId of allRowIds) {
		const beforeRow = beforeParsed?.recordsById[rowId] ?? {};
		const afterRow = afterParsed?.recordsById[rowId] ?? {};

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
					detectedCellChanges.push({
						type: "csv-v2-cell",
						entity_id,
						snapshot: { text: afterCell },
					});
				}
			}
			// Cell exists only in before -> delete
			else if (beforeCell !== undefined) {
				detectedCellChanges.push({
					type: "csv-v2-cell",
					entity_id,
					snapshot: null,
				});
			}
			// Cell exists only in after -> insert
			else if (afterCell !== undefined) {
				detectedCellChanges.push({
					type: "csv-v2-cell",
					entity_id,
					snapshot: { text: afterCell },
				});
			}
		}

		const indexBefore = beforeParsed
			? beforeParsed?.rowOrder.indexOf(rowId)
			: -1;
		const indexAfter = afterParsed ? afterParsed?.rowOrder.indexOf(rowId) : -1;

		if (indexAfter === -1) {
			detectedRowChanges.push({
				entity_id: rowId,
				type: "csv-v2-row",
				snapshot: null,
			});
		} else if (
			stringArraysDiffer(
				Object.keys(beforeRow).sort(),
				Object.keys(afterRow).sort(),
			) ||
			indexAfter !== indexBefore
		) {
			detectedRowChanges.push({
				entity_id: rowId,
				type: "csv-v2-row",
				snapshot: {
					rowIndex: indexAfter,
					rowEntities: Object.keys(afterRow)
						.map((columnName) => toEntityId(rowId, columnName))
						.sort(),
				},
			});
		}
	}

	return [
		...detectedSchemaDefChanges,
		...detectedRowChanges,
		...detectedCellChanges,
	];
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

function stringArraysDiffer(arr1: string[], arr2: string[]): boolean {
	if (arr1.length !== arr2.length) return true;

	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return true;
	}

	return false;
}
