import type {
	DetectedChange,
	FromLixSchemaDefinition,
	LixPlugin,
} from "@lix-js/sdk";
import { CellSchemaV1 } from "./schemas/cell.js";
import { HeaderSchemaV1 } from "./schemas/header.js";
import { parseCsv } from "./utilities/parseCsv.js";
import { RowSchemaV1 } from "./schemas/row.js";

type DetectArgs = Parameters<NonNullable<LixPlugin["detectChanges"]>>[0];
type DetectBefore = NonNullable<DetectArgs["before"]>;
type DetectAfter = DetectArgs["after"];

function toEntityId(rowId: string, columnName: string) {
	// row id already is <unique column>|<unique value>
	// so we can just append the column name to it
	// <unique column>|<unique value>|<column name>
	return rowId + "|" + columnName;
}

function extractUniqueColumn(input: unknown): string | undefined {
	if (input && typeof input === "object") {
		const record = input as Record<string, unknown>;
		const value = record.unique_column;
		return typeof value === "string" && value.length > 0 ? value : undefined;
	}
	return undefined;
}

const getMetadataSource = (file?: DetectBefore | DetectAfter) => {
	return (
		(file as { lixcol_metadata?: unknown } | undefined)?.lixcol_metadata ??
		file?.metadata
	);
};

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = ({
	before,
	after,
}) => {
	// heuristic can be improved later by deriving a unique column
	const uniqueColumnBefore = extractUniqueColumn(getMetadataSource(before));
	const uniqueColumnAfter = extractUniqueColumn(getMetadataSource(after));

	if (uniqueColumnBefore === undefined && uniqueColumnAfter === undefined) {
		console.warn("The unique_column metadata is required to detect changes");
		return [];
	}

	const columnForBefore = uniqueColumnBefore ?? uniqueColumnAfter;
	const columnForAfter = uniqueColumnAfter ?? uniqueColumnBefore;

	if (columnForBefore === undefined || columnForAfter === undefined) {
		// This should not happen due to the guard above, but narrows types for TS.
		return [];
	}

	const detectedChanges: DetectedChange<
		FromLixSchemaDefinition<
			typeof CellSchemaV1 | typeof HeaderSchemaV1 | typeof RowSchemaV1
		>
	>[] = [];

	const beforeParsed = parseCsv(before?.data, columnForBefore);
	const afterParsed = parseCsv(after?.data, columnForAfter);

	const headerChanged = checkHeaderChange(
		beforeParsed.delimeter,
		afterParsed.delimeter,
		beforeParsed.header,
		afterParsed.header,
	);

	if (
		headerChanged ||
		// in case the unique column has been set, the change needs to be detected
		uniqueColumnBefore !== uniqueColumnAfter
	) {
		detectedChanges.push({
			schema: HeaderSchemaV1,
			entity_id: "header",
			snapshot_content: {
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
				schema: RowSchemaV1,
				entity_id: rowId,
				// if the row was deleted, snapshot is null
				snapshot_content:
					rowLineNumberAfter === undefined
						? null
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
						schema: CellSchemaV1,
						entity_id,
						snapshot_content: { text: afterCell, rowId: rowId },
					});
				}
			}
			// Cell exists only in before -> delete
			else if (beforeCell !== undefined) {
				detectedChanges.push({
					schema: CellSchemaV1,
					entity_id,
					snapshot_content: null,
				});
			}
			// Cell exists only in after -> insert
			else if (afterCell !== undefined) {
				detectedChanges.push({
					schema: CellSchemaV1,
					entity_id,
					snapshot_content: { text: afterCell, rowId: rowId },
				});
			}
		}
	}

	return detectedChanges;
};

function checkHeaderChange(
	beforeDelimeter: string,
	afterDelimeter: string,
	before?: string[],
	after?: string[],
) {
	const beforeHeaderRow = before?.join(beforeDelimeter);
	const afterHeaderRow = after?.join(afterDelimeter);
	return beforeHeaderRow !== afterHeaderRow;
}
