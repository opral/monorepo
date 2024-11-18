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
 *   console.log(parsed['bob']) // ["56", "bob"]
 *
 *   ```
 */
export function parseCsv(
	data: ArrayBuffer | undefined,
	uniqueColumn: string,
): {
	index: Record<string, Record<string, string>>;
	lineNumbers: Record<string, number>;
	header: string[];
} {
	const parsed = data
		? papaparse.parse(new TextDecoder().decode(data), {
				skipEmptyLines: true,
				header: true,
			})
		: undefined;

	const index = parsed?.data ? createIndex(parsed, uniqueColumn) : {};

	const lineNumbers: Record<string, number> = {};

	if (parsed?.data) {
		for (const [i, row] of (
			parsed?.data as Record<string, string>[]
		).entries()) {
			const uniqueValue = row[uniqueColumn];
			if (uniqueValue) {
				const entity_id = `${uniqueColumn}|${uniqueValue}`;
				lineNumbers[entity_id] = i;
			}
		}
	}

	return { index, header: parsed?.meta.fields ?? [], lineNumbers };
}

/**
 * Creates an index of the csv based on the row entity id.
 *
 * The index eases applying and deleting changes to the csv.
 */
function createIndex(parsed: papaparse.ParseResult<any>, uniqueColumn: string) {
	const index: Record<string, Record<string, string>> = {};

	for (const row of (parsed?.data as Record<string, string>[]) ?? []) {
		const uniqueValue = row[uniqueColumn];
		if (uniqueValue) {
			const entity_id = `${uniqueColumn}|${uniqueValue}`;
			for (const column in row) {
				if (!index[entity_id]) {
					index[entity_id] = {};
				}
				index[entity_id]![column] = row[column]!;
			}
		}
	}

	return index;
}
