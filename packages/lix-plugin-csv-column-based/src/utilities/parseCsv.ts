import * as papaparse from "papaparse";

/**
 * Parses the CSV based on the unique column.
 *
 * @returns
 *   The parsed CSV data indexed by the unique column.
 *
 * @example
 *   ```
 *   const data = new TextEncoder().encode("age,name\n23,alice\n56,bob");
 *   const parsed = parseCsv(data, "name");
 *
 *   console.log(parsed); // { "alice": { age: "23", name: "alice"}, "bob": { age: "56", name: "bob"} }
 *   console.log(parsed['bob']) // { age: "56", name: "bob"}
 *
 *   ```
 */
export function parseCsv(data: ArrayBuffer, uniqueColumn: string) {
	const parsed = data
		? papaparse.parse(new TextDecoder().decode(data), {
				skipEmptyLines: true,
			})
		: undefined;

	const rowOrder: string[] = [];
	const recordsById: Record<string, Record<string, string>> = {};
	const headerRow = parsed?.data?.[0] as string[];
	if (!headerRow) {
		throw new Error("No Header row found");
	}
	const uniqueColumnIndex = headerRow.indexOf(uniqueColumn);
	if (uniqueColumnIndex === undefined) {
		throw new Error(
			"Couldn't find the unque column " +
				uniqueColumn +
				" in the header row " +
				headerRow.join(","),
		);
	}
	let isHeaderRow = true;
	for (const row of (parsed?.data as Array<string[]>) ?? []) {
		// don't index the header row
		if (isHeaderRow) {
			isHeaderRow = false;
			continue;
		}
		const uniqueValue = row[uniqueColumnIndex];
		if (uniqueValue) {
			const entity_id = `${uniqueColumn}|${uniqueValue}`;

			for (const [columnI, value] of row.entries()) {
				if (!recordsById[entity_id]) {
					recordsById[entity_id] = {};
				}
				recordsById[entity_id]![headerRow[columnI]!] = value;
			}

			if (rowOrder.includes(entity_id)) {
				throw new Error(
					"Duplicated entry " +
						entity_id +
						" in unique column " +
						uniqueColumn +
						"  detected (Row=" +
						rowOrder.length +
						")",
				);
			}
			rowOrder.push(entity_id);
		}
	}

	return { recordsById, headerRow, rowOrder };
}
