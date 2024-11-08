import { type LixPlugin } from "@lix-js/sdk";
import papaparse from "papaparse";
import { parseCsv } from "./utilities/parseCsv.js";
import type {
	DetectedRowChange,
	DetectedSchemaDefinitionChange,
} from "./detectChanges.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	const uniqueColumn = file.metadata?.unique_column;

	if (uniqueColumn === undefined) {
		throw new Error("The unique_column metadata is required to apply changes");
	}

	const parsedFile = parseCsv(file.data, uniqueColumn);

	if (parsedFile === undefined) {
		throw new Error("Failed to parse csv");
	}

	let fields = parsedFile.headerRow;
	let rowOrder = parsedFile.rowOrder;

	for (const change of changes.filter((c) => c.type === "csv-v2-schema")) {
		const snapshot = await lix.db
			.selectFrom("snapshot")
			.where("id", "=", change.snapshot_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const schemaChange = {
			...change,
			snapshot: snapshot.content,
		} as unknown as DetectedSchemaDefinitionChange;
		fields = schemaChange.snapshot!.columnNames;
	}

	let rowChanges: DetectedRowChange[] = [];

	for (const change of changes.filter((c) => c.type === "csv-v2-row")) {
		const snapshot = await lix.db
			.selectFrom("snapshot")
			.where("id", "=", change.snapshot_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		rowChanges.push({
			...change,
			snapshot: snapshot.content,
		} as unknown as DetectedRowChange);
	}

	// sort with deleted rows first followed by rows by row index
	// so that we can just splice the elements at there new position
	rowChanges = rowChanges.sort((a, b) => {
		if (!a.snapshot && b.snapshot) return -1;
		if (a.snapshot && !b.snapshot) return 1;
		if (a.snapshot && b.snapshot) {
			return a.snapshot.rowIndex - b.snapshot.rowIndex;
		}
		return 0;
	});

	for (const rowChange of rowChanges) {
		// remove the entry
		rowOrder = rowOrder.filter((rowId) => rowId !== rowChange.entity_id);
		if (rowChange.snapshot) {
			// if it still exist insert it at the new position
			rowOrder.splice(rowChange.snapshot!.rowIndex, 0, rowChange.entity_id);
		}
	}

	for (const change of changes.filter((c) => c.type === "csv-v2-cell")) {
		// We have three types of changes
		// schema changes -> only affect the columns to be printed out and the order
		// rows -> contain the information about the row index (the reference to the entity id is not relevant for parsing)
		// cells -> the actual content of the cels

		const snapshot = await lix.db
			.selectFrom("snapshot")
			.where("id", "=", change.snapshot_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const [uniqueColumn, uniqueColumnValue, column] = change.entity_id.split(
			"|",
		) as [string, string, string];

		const rowId = `${uniqueColumn}|${uniqueColumnValue}`;

		// console.log("processing change " + rowId + " col " + column, change);
		// change is a deletion
		if (snapshot.content === null) {
			// console.log("deltion change");
			delete parsedFile.recordsById[rowId]![column!];
			// Check if the precvios delete of the column lead to an empty row - if so delete it
			if (Object.keys(parsedFile.recordsById[rowId]!).length === 0) {
				delete parsedFile.recordsById[rowId];
			}
		}

		// change is an update or create
		// the update will overwrite the column in place
		// the create will append a new key to the object
		else {
			if (!parsedFile.recordsById[rowId]) {
				parsedFile.recordsById[rowId] = {} as Record<string, string>;
			}
			parsedFile.recordsById[rowId]![column] = snapshot.content.text;
		}

		// console.log("applied change", change, "to csv\n\n", parsed);
	}

	const data = [];

	for (const rowId of rowOrder) {
		data.push(parsedFile.recordsById[rowId]);
	}

	const csv = papaparse.unparse(
		{
			fields: fields,
			data,
		},
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
