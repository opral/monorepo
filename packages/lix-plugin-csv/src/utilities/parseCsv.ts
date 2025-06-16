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
	data: Uint8Array | undefined,
	uniqueColumn: string,
): {
	index: Map<string, Record<string, string>>;
	lineNumbers: Record<string, number>;
	header: string[];
	delimeter: string;
} {
	const parsed = data
		? papaparse.parse(new TextDecoder().decode(data), {
				skipEmptyLines: true,
				header: true,
			})
		: undefined;

	const index = parsed?.data ? createIndex(parsed, uniqueColumn) : new Map();

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

	return {
		index,
		header: parsed?.meta.fields ?? [],
		lineNumbers,
		delimeter: parsed?.meta.delimiter ?? ",",
	};
}

/**
 * Creates an index of the csv based on the row entity id.
 *
 * The index eases applying and deleting changes to the csv.
 */
function createIndex(parsed: papaparse.ParseResult<any>, uniqueColumn: string) {
	const index = new Map<string, Record<string, string>>();

	for (const row of (parsed?.data as Record<string, string>[]) ?? []) {
		const uniqueValue = row[uniqueColumn];
		if (uniqueValue) {
			const entity_id = `${uniqueColumn}|${uniqueValue}`;
			for (const column in row) {
				const value = index.get(entity_id) ?? {};
				index.set(entity_id, { ...value, [column]: row[column]! });
			}
		}
	}

	return index;
}
