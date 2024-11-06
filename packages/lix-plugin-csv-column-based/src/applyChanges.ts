import { type LixPlugin } from "@lix-js/sdk";
import papaparse from "papaparse";
import { parseCsv } from "./utilities/parseCsv.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	const uniqueColumn = file.metadata?.unique_column;

	if (uniqueColumn === undefined) {
		throw new Error("The unique_column metadata is required to apply changes");
	}

	const [parsed, headerRow] = parseCsv(file.data, uniqueColumn);

	if (parsed === undefined) {
		throw new Error("Failed to parse csv");
	}

	for (const change of changes) {
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
			delete parsed[rowId]![column!];
			// Check if the precvios delete of the column lead to an empty row - if so delete it
			if (Object.keys(parsed[rowId]!).length === 0) {
				delete parsed[rowId];
			}
		}

		// change is an update or create
		// the update will overwrite the column in place
		// the create will append a new key to the object
		else {
			if (!parsed[rowId]) {
				parsed[rowId] = {} as Record<string, string>;
			}
			parsed[rowId]![column] = snapshot.content.text;
		}

		// console.log("applied change", change, "to csv\n\n", parsed);
	}

	const csv = papaparse.unparse(
		{ fields: headerRow, data: Object.values(parsed) },
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
