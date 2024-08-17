import type { DiffReport, LixPlugin } from "../plugin.js";
import papaparse from "papaparse";

/**
 * A mock plugin that can be used for testing purposes.
 */
export const mockCsvPlugin: LixPlugin<{
	cell: { rowIndex: number; columnIndex: number; text: string };
}> = {
	key: "csv",
	glob: "*.csv",
	diff: {
		file: async ({ old, neu }) => {
			const result: DiffReport[] = [];
			const oldParsed = old
				? papaparse.parse(new TextDecoder().decode(old.data))
				: undefined;
			const newParsed = neu
				? papaparse.parse(new TextDecoder().decode(neu.data))
				: undefined;

			const numRows = Math.max(
				oldParsed?.data.length ?? 0,
				newParsed?.data.length ?? 0,
			);

			if (newParsed) {
				for (let i = 0; i < numRows; i++) {
					const oldRow = oldParsed?.data[i] as string[];
					const neuRow = newParsed.data[i] as string[];
					const numColumns = Math.max(oldRow?.length ?? 0, neuRow?.length ?? 0);
					for (let j = 0; j < numColumns; j++) {
						const oldText = oldRow?.[j];
						const neuText = neuRow?.[j];
						const diff = await mockCsvPlugin.diff.cell({
							old: oldText
								? {
										rowIndex: i,
										columnIndex: j,
										text: oldText,
									}
								: undefined,
							neu: neuText
								? {
										rowIndex: i,
										columnIndex: j,
										text: neuText,
									}
								: undefined,
						});

						if (diff.length > 0) {
							result.push(...diff);
						}
					}
				}
			}
			return result;
		},
		// @ts-expect-error type narrowing bug
		cell: async ({ old, neu }) => {
			if (old?.text === neu?.text) {
				return [];
			} else {
				return [
					{
						type: "cell",
						operation: old && neu ? "update" : old ? "delete" : "create",
						old: old,
						neu: neu,
					},
				];
			}
		},
	},
};
