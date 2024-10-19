import { getLeafChange, type LixPlugin } from "@lix-js/sdk";
import papaparse from "papaparse";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	if (file.path?.endsWith(".csv")) {
		const parsed = papaparse.parse(new TextDecoder().decode(file.data), {
			header: true,
		});

		const uniqueColumn = file.metadata!.unique_column;

		// console.log({ changes, parsed });
		for (const change of changes) {
			// console.log("change", change);
			if (change.content) {
				const changedRow = change.content as unknown as Record<string, string>;

				let existingRow = (parsed.data as Record<string, unknown>[]).find(
					(row) => row[uniqueColumn] === change.content![uniqueColumn],
				);

				// console.log({ id, existingRow, change, parsed, column })

				// create the row if it doesn't exist
				if (!existingRow) {
					existingRow = {};
					parsed.data.push(existingRow);
				}

				for (const [key, value] of Object.entries(changedRow)) {
					existingRow[key] = value;
				}
			}
		}

		const csv = papaparse.unparse(parsed as any);

		return {
			fileData: new TextEncoder().encode(csv),
		};
	} else if (file.path?.endsWith("_position.json")) {
		const leafChange = [
			...new Set(
				await Promise.all(
					changes.map(async (change) => {
						const leafChange = await getLeafChange({ change, lix });
						// enable string comparison to avoid duplicates
						return JSON.stringify(leafChange);
					}),
				),
			),
		].map((v) => JSON.parse(v));

		if (leafChange.length === 0) {
			return { fileData: file.data };
		}
		if (leafChange.length !== 1) {
			throw new Error(
				"we only save a snapshot from the settings file - there must be only one change " +
					leafChange.length +
					" found" +
					JSON.stringify(changes),
			);
		}
		if (leafChange[0].operation === "create") {
			return {
				fileData: new TextEncoder().encode(
					JSON.stringify(leafChange[0].value.data),
				),
			};
		} else if (leafChange[0].operation === "update") {
			return {
				fileData: new TextEncoder().encode(
					JSON.stringify(leafChange[0].value.data),
				),
			};
		} else {
			throw new Error(
				`Operation ${leafChange[0].operation} on settings file currently not supported`,
			);
		}
	} else {
		throw new Error(
			"Unimplemented. Only the db.sqlite file can be handled for now.",
		);
	}
};
