import { type LixPlugin } from "@lix-js/sdk";
import papaparse from "papaparse";
import { parseCsv } from "./utilities/parseCsv.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	const uniqueColumn = file.metadata?.unique_column;

	const text = new TextDecoder().decode(file.data);

	console.log("applyChanges", changes, "intial\n\n", text);

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

		// change is a deletion
		if (snapshot.content === null) {
			delete parsed[change.entity_id];
		}
		// change is an update or create
		// the update will overwrite the row in place
		// the create will append a new key to the object
		else {
			parsed[change.entity_id] = snapshot.content.text.split(",");
		}

		console.log("applied change", change, "to csv\n\n", parsed);
	}

	const csv = papaparse.unparse([headerRow, ...Object.values(parsed)], {
		// using '\n' as the default newline assuming that windows
		// treats '\n' as a newline character nowadays
		newline: "\n",
	});

	console.log("applied csv\n\n", csv);

	return {
		fileData: new TextEncoder().encode(csv),
	};
};
