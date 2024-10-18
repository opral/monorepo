/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DetectedChange, LixPlugin } from "../plugin.js";
import papaparse from "papaparse";

type Cell = { rowIndex: number; columnIndex: number; text: string };

/**
 * A mock plugin that can be used for testing purposes.
 */
export const mockCsvPlugin: LixPlugin = {
	key: "csv",
	glob: "*.csv",
	applyChanges: async ({ file, changes }) => {
		const parsed = papaparse.parse(new TextDecoder().decode(file.data));
		for (const change of changes) {
			if (change.value) {
				const { rowIndex, columnIndex, text } = change.value as unknown as Cell;
				// create the row if it doesn't exist
				if (!parsed.data[rowIndex]) {
					parsed.data[rowIndex] = [];
				}
				for (let i = 0; i < columnIndex; i++) {
					// create the column if it doesn't exist recursively
					// till the current cell is reached
					// else, setting the cell value based on the index
					// will lead to bugs
					if (!(parsed.data[rowIndex] as any)[i]) {
						(parsed.data[rowIndex] as any)[i] = "";
					}
				}
				// update the cell
				(parsed.data[rowIndex] as any)[columnIndex] = text;
			} else {
				const [rowIndex, columnIndex] = change.entity_id.split("-").map(Number);
				(parsed.data as any)[rowIndex!][columnIndex!] = "";
				// if the row is empty after deleting the cell, delete the row
				if (
					(parsed.data[rowIndex!] as any).every((cell: string) => cell === "")
				) {
					parsed.data.splice(rowIndex!, 1);
				}
			}
		}
		const csv = papaparse.unparse(parsed as any, {
			...parsed.meta,
			// parse.meta and unparse mapping
			newline: parsed.meta.linebreak,
		});
		return {
			fileData: new TextEncoder().encode(csv),
		};
	},
	detectChanges: async ({ before, after }) => {
		const result: DetectedChange[] = [];
		const beforeParsed = before
			? papaparse.parse(new TextDecoder().decode(before.data))
			: undefined;
		const afterParsed = after
			? papaparse.parse(new TextDecoder().decode(after.data))
			: undefined;

		const numRows = Math.max(
			beforeParsed?.data.length ?? 0,
			afterParsed?.data.length ?? 0,
		);

		if (afterParsed) {
			for (let i = 0; i < numRows; i++) {
				const beforeRow = beforeParsed?.data[i] as string[];
				const afterRow = afterParsed.data[i] as string[];
				const numColumns = Math.max(
					beforeRow?.length ?? 0,
					afterRow?.length ?? 0,
				);
				for (let j = 0; j < numColumns; j++) {
					const beforeText = beforeRow?.[j];
					const afterText = afterRow?.[j];
					if (beforeText !== afterText) {
						result.push({
							type: "cell",
							entity_id: `${i}-${j}`,
							snapshot: afterText
								? {
										rowIndex: i,
										columnIndex: j,
										text: afterText,
									}
								: undefined,
						});
					}
				}
			}
		}
		return result;
	},
};
