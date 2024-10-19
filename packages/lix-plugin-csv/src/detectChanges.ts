import type { DetectedChange, LixFile, LixPlugin } from "@lix-js/sdk";
import papaparse from "papaparse";

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	// heuristic can be improved later by deriving a unique column
	const uniqueColumnBefore = before?.metadata?.csv_plugin_unique_column;
	const uniqueColumnAfter = after?.metadata?.csv_plugin_unique_column;

	if (uniqueColumnBefore === undefined && uniqueColumnAfter === undefined) {
		throw new Error(
			"The csv_plugin_unique_column metadata is required to detect changes",
		);
	}

	const detectedChanges: DetectedChange[] = [];

	const beforeParsed = parseIfDefined(before?.data, uniqueColumnBefore);
	const afterParsed = parseIfDefined(after?.data, uniqueColumnAfter);

	const allIds = new Set([
		...Object.keys(beforeParsed ?? {}),
		...Object.keys(afterParsed ?? {}),
	]);

	// mark all rows as deleted and newly inserted
	// if the unique column changed
	if (uniqueColumnChanged(before, after)) {
		const uniqueColumnBefore = before?.metadata
			?.csv_plugin_unique_column as string;
		const uniqueColumnAfter = after?.metadata
			?.csv_plugin_unique_column as string;
		for (const id in beforeParsed) {
			// mark all rows as deleted
			detectedChanges.push({
				type: "row",
				entity_id: uniqueColumnBefore + ":" + id,
				snapshot: undefined,
			});
		}
		for (const id in afterParsed) {
			// mark all rows as newly inserted
			detectedChanges.push({
				type: "row",
				entity_id: uniqueColumnAfter + ":" + id,
				snapshot: afterParsed[id],
			});
		}
		return detectedChanges;
	}

	// using the after metadata as default because that's the unique
	// column of interest. fallback to before (if deletions happened)
	const uniqueColumn = uniqueColumnAfter ?? uniqueColumnBefore;

	// Loop over all unique IDs and detect changes
	for (const id of allIds) {
		// the entity_id contains the unique column name
		// in case the unique column is changed
		const entity_id = uniqueColumn + ":" + id;
		const beforeRow = beforeParsed?.[id];
		const afterRow = afterParsed?.[id];

		// Row exists in both datasets -> check for update
		if (beforeRow && afterRow) {
			if (!isEqual(beforeRow, afterRow)) {
				detectedChanges.push({
					type: "row",
					entity_id,
					snapshot: afterRow,
				});
			}
		}
		// Row exists only in before -> delete
		else if (beforeRow) {
			detectedChanges.push({
				type: "row",
				entity_id,
				snapshot: undefined,
			});
		}
		// Row exists only in after -> insert
		else if (afterRow) {
			detectedChanges.push({
				type: "row",
				entity_id,
				snapshot: afterRow,
			});
		}
	}
	return detectedChanges;
};

/**
 * Parses the CSV based on the unique column.
 *
 * @returns
 *   The parsed CSV data indexed by the unique column.
 *
 * @example
 *   ```
 *   const data = new TextEncoder().encode("age,name\n23,alice\n56,bob");
 *   const parsed = parseIfDefined(data, "name");
 *
 *   console.log(parsed); // { "alice": ["23", "alice"], "bob": ["56", "bob"] }
 *   console.log(parsed['bob']) // ["56", "bob"]
 *
 *   ```
 */
function parseIfDefined(data: ArrayBuffer | undefined, uniqueColumn: string) {
	const parsed = data
		? papaparse.parse(new TextDecoder().decode(data), {
				skipEmptyLines: true,
			})
		: undefined;
	const index: Record<string, string[]> = {};
	const headerRow = parsed?.data?.[0] as string[];
	if (!headerRow) {
		return undefined;
	}
	const uniqueColumnIndex = headerRow.indexOf(uniqueColumn);
	if (uniqueColumnIndex === undefined) {
		return undefined;
	}
	let isHeaderRow = true;
	for (const row of (parsed?.data as Array<string[]>) ?? []) {
		// don't index the header row
		if (isHeaderRow) {
			isHeaderRow = false;
			continue;
		}
		const id = row[uniqueColumnIndex];
		if (id) {
			index[id] = row;
		}
	}
	return index;
}

function isEqual(rowA: string[], rowB: string[]): boolean {
	return rowA.join() === rowB.join();
}

function uniqueColumnChanged(before?: LixFile, after?: LixFile) {
	return (
		// both files have a unique column
		before?.metadata?.csv_plugin_unique_column &&
		after?.metadata?.csv_plugin_unique_column &&
		// check if unique columns differ
		before.metadata.csv_plugin_unique_column !==
			after.metadata.csv_plugin_unique_column
	);
}
