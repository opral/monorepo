import { getLeafChange, type LixPlugin } from "@lix-js/sdk";
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

	const leafChanges = await Promise.all(
		changes.map((change) => getLeafChange({ change, lix })),
	);

	for (const change of leafChanges) {
		const snapshot = await lix.db
			.selectFrom("snapshot")
			.where("id", "=", change.snapshot_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// change is a deletion
		if (snapshot.content === null) {
			delete parsed[change.entity_id];
		}
		// change is an update or create
		// the update will overwrite the row in place
		// the create will append a new key to the object
		else {
			// @ts-expect-error - wrong snapshot type see https://github.com/opral/lix-sdk/issues/110
			parsed[change.entity_id] = snapshot.content;
		}
	}

	const csv = papaparse.unparse([headerRow, ...Object.values(parsed)], {
		// using '\n' as the default newline assuming that windows
		// treats '\n' as a newline character nowadays
		newline: "\n",
	});

	return {
		fileData: new TextEncoder().encode(csv),
	};
};
