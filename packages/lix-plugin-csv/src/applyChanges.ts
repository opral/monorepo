import { type Change, type LixPlugin } from "@lix-js/sdk";
import papaparse from "papaparse";
import { parseCsv } from "./utilities/parseCsv.js";
import { CellSchemaV1 } from "./schemas/cell.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	file,
	changes,
}) => {
	const uniqueColumn = file.metadata?.unique_column as string | undefined;

	if (uniqueColumn === undefined) {
		throw new Error("The unique_column metadata is required to apply changes");
	}

	const parsed = parseCsv(file.data ?? newCsvFile(changes), uniqueColumn);

	if (parsed === undefined) {
		throw new Error("Failed to parse csv");
	}

	const rowOrderChanges: (Change & { snapshot_content: any })[] = [];

	for (const change of changes) {
		// save row order changes for later
		rowOrderChanges.push(change);

		if (change.schema_key === CellSchemaV1["x-lix-key"]) {
			const [uniqueColumn, uniqueColumnValue, column] = change.entity_id.split(
				"|",
			) as [string, string, string];

			const rowId = `${uniqueColumn}|${uniqueColumnValue}`;

			// console.log("processing change " + rowId + " col " + column, change);
			// change is a deletion
			if (change.snapshot_content === null) {
				delete parsed.index.get(rowId)?.[column];
				// Check if the column deletion lead to an empty row - if so delete the entire row
				if (Object.keys(parsed.index.get(rowId) ?? {})?.length === 0) {
					parsed.index.delete(rowId);
				}
			}
			// change is an update or create
			// the update will overwrite the column in place
			// the create will append a new key to the object
			else {
				if (parsed.index.get(rowId) === undefined) {
					parsed.index.set(rowId, {});
				}
				parsed.index.get(rowId)![column] = change.snapshot_content?.text;
			}
		}
	}

	for (const change of rowOrderChanges) {
		if (change.snapshot_content === null) {
			// row has been deleted
			parsed.index.delete(change.entity_id);
		} else {
			// move row to new position
			const rowContent = parsed.index.get(change.entity_id);
			parsed.index.delete(change.entity_id);
			parsed.index = insertIntoMapAtPosition(
				parsed.index,
				change.entity_id,
				rowContent!,
				change.snapshot_content?.lineNumber,
			);
		}
	}

	const csv = papaparse.unparse(
		{ fields: parsed.header ?? [], data: [...parsed.index.values()] },
		{
			// using '\n' as the default newline assuming that windows
			// treats '\n' as a newline character nowadays
			newline: "\n",
		},
	);

	return {
		fileData: new TextEncoder().encode(csv),
	};
};

// js maps don't support inserting at a specific position
// manual iteration is needed.
function insertIntoMapAtPosition<K, V>(
	map: Map<K, V>,
	key: K,
	value: V,
	position: number,
): Map<K, V> {
	const newMap = new Map<K, V>();
	let index = 0;

	for (const [k, v] of map) {
		if (index === position) {
			newMap.set(key, value);
		}
		newMap.set(k, v);
		index++;
	}

	// If the position is greater than the size of the map, add the new entry at the end
	if (position >= map.size) {
		newMap.set(key, value);
	}

	return newMap;
}

function newCsvFile(changes: Change[]) {
	const headerChange = changes.find((c) => c.entity_id === "header");
	if (headerChange === undefined) {
		throw new Error("No header change found. Can't reconstruct csv file.");
	}

	// @ts-expect-error - waiting for inlining https://github.com/opral/lix-sdk/issues/307
	if (headerChange.snapshot_content === null) {
		throw new Error("Header snapshot is empty. Can't reconstruct csv file.");
	}

	// create a csv file that has the header column names
	return new TextEncoder().encode(
		// @ts-expect-error - waiting for inlining https://github.com/opral/lix-sdk/issues/307
		headerChange.snapshot_content.columnNames.join(",") + "\n",
	);
}
