// import type { DiffReport, LixPlugin } from "@lix-js/sdk"

import papaparse from "papaparse";

/**
 * @type {import('@lix-js/sdk').LixPlugin<{
 *  cell: Cell
 * }>}
 */
import {
	// getLowestCommonAncestor,
	// getLeafChange,
	// type Conflict,
	type LixPlugin,
	Conflict,
	DiffReport,
	getLeafChange,
	getLowestCommonAncestor,
	LixFile,
} from "@lix-js/sdk";

// await resolveConflict({
// 	lix: lix,
// 	conflict: conflict,
// 	resolveWithChange: changes[0]!,
// });

// const primaryKeys = ["country"];

// function getId(row: any) {
// 	const primaryKeyList = primaryKeys.map((key) => row[key]).filter(Boolean);
// 	if (primaryKeyList.length < primaryKeys.length) {
// 		return undefined;
// 	}
// 	return `${primaryKeyList.join("__")}-`;
// }

function compareObjects(
	o1: Record<string, string>,
	o2: Record<string, string>
) {
	const normalizedObj1 = Object.fromEntries(
		Object.entries(o1).sort(([k1], [k2]) => k1.localeCompare(k2))
	);
	const normalizedObj2 = Object.fromEntries(
		Object.entries(o2).sort(([k1], [k2]) => k1.localeCompare(k2))
	);
	return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
}

function getChangedKeys<T extends Record<string, string>>(
	oldObj: T,
	newObj: T
): string[] | undefined {
	// check if the objects are the same, report all keys that differ in an array, oldObj might be undefined when creating
	const keys = Object.keys({ ...oldObj, ...newObj });
	return keys.filter((key) => {
		if (!oldObj) {
			return true;
		}
		return oldObj[key] !== newObj[key];
	});
}

export const plugin: LixPlugin = {
	key: "csv",
	glob: "*",

	detectConflicts: async ({
		sourceLix,
		targetLix,
		leafChangesOnlyInSource,
	}) => {
		// console.log({ sourceLix, targetLix, leafChangesOnlyInSource });
		const result: Conflict[] = [];

		for (const change of leafChangesOnlyInSource) {
			const lowestCommonAncestor = await getLowestCommonAncestor({
				sourceChange: change,
				sourceLix,
				targetLix,
			});

			if (lowestCommonAncestor === undefined) {
				// no common parent, no conflict. must be an insert
				continue;
			}

			const leafChangeInTarget = await getLeafChange({
				change: lowestCommonAncestor,
				lix: targetLix,
			});

			if (lowestCommonAncestor.id === leafChangeInTarget.id) {
				// no conflict. the lowest common ancestor is
				// the leaf change in the target. aka, no changes
				// in target have been made that could conflict with the source
				continue;
			}

			const hasDiff =
				JSON.stringify(change.value) !==
				JSON.stringify(leafChangeInTarget.value);
			if (hasDiff === false) {
				continue;
			}

			// naive raise any snapshot difference as a conflict for now
			// more sophisticated conflict reporting can be incrementally added
			result.push({
				change_id: leafChangeInTarget.id,
				conflicting_change_id: change.id,
				reason:
					"The snapshots of the change do not match. More sophisticated reasoning will be added later.",
				meta: undefined,
				resolved_with_change_id: undefined,
			});
		}

		return result;
	},
	// (args: {
	// 	sourceLix: LixReadonly;
	// 	targetLix: LixReadonly;
	// 	/**
	// 	 * Leaf changes that are only in the source lix.
	// 	 *
	// 	 * You can traverse the parents of the leaf changes to find
	// 	 * conflicting changes in the target lix.
	// 	 */
	// 	leafChangesOnlyInSource: Change[];
	// }) => Promise<Conflict[]>;
	// 	file: async ({ current, conflicts, changes }) => {
	// 		// incoming.  fileId
	// 		if (!papaparse) {
	// 			// @ts-expect-error - no types
	// 			papaparse = (await import("http://localhost:5174/papaparse.js")).default
	// 		}
	// 		const currentParsed = current
	// 			? papaparse.parse(new TextDecoder().decode(current), {
	// 					header: true,
	// 			  })
	// 			: undefined
	// 		if (currentParsed === undefined) {
	// 			throw new Error("cannot parse file for merging ")
	// 		}
	// 		const resolved = []
	// 		const unresolved = []
	// 		for (const conflict of conflicts) {
	// 			// @ts-ignore
	// 			const { hasConflict, result } = await plugin.merge.cell(conflict)
	// 			result && resolved.push([result])
	// 			hasConflict && unresolved.push(conflict)
	// 		}
	// 		for (const change of [...changes, ...resolved]) {
	// 			const latestChange = change[0] // only using latest change for simple merge cases
	// 			const [rowId, columnName] = latestChange.value.id.split("-")
	// 			// TODO: handle insert/ delete row
	// 			const existingRow = currentParsed.data.find((row) => row.id === rowId)
	// 			existingRow[columnName] = latestChange.value.text
	// 		}
	// 		const resultBlob = new TextEncoder().encode(
	// 			// @ts-expect-error
	// 			papaparse.unparse(currentParsed)
	// 		)
	// 		return { result: resultBlob, unresolved }
	// 	},
	// 	cell: async ({ current, incoming, base }) => {
	// 		// always raise conflicts resolving column "v" for testing
	// 		if (current[0].value.id.endsWith("-v")) {
	// 			const diff = await plugin.diff.cell({ old: current[0].value, neu: incoming[0].value })
	// 			if (diff.length > 0) {
	// 				console.log({ current, incoming, base })
	// 				return { hasConflict: true }
	// 			}
	// 		}
	// 		let chosen
	// 		// choose latest edit
	// 		if (current[0].created > incoming[0].created) {
	// 			chosen = current[0]
	// 		} else {
	// 			chosen = incoming[0]
	// 		}
	// 		return { result: chosen }
	// 	},

	applyChanges: async ({ changes, file, lix }) => {
		if (file.path?.endsWith(".csv")) {
			const parsed = papaparse.parse(new TextDecoder().decode(file.data), {
				header: true,
			});

			const uniqueColumn = file.metadata!.unique_column;

			// console.log({ changes, parsed });
			for (const change of changes) {
				// console.log("change", change);
				if (change.value) {
					const changedRow = change.value as unknown as Record<string, string>;

					let existingRow = (parsed.data as Record<string, unknown>[]).find(
						(row) => row[uniqueColumn] === change.value![uniqueColumn]
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
						})
					)
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
						JSON.stringify(changes)
				);
			}
			if (leafChange[0].operation === "create") {
				return {
					fileData: new TextEncoder().encode(
						JSON.stringify(leafChange[0].value.data)
					),
				};
			} else if (leafChange[0].operation === "update") {
				return {
					fileData: new TextEncoder().encode(
						JSON.stringify(leafChange[0].value.data)
					),
				};
			} else {
				throw new Error(
					`Operation ${leafChange[0].operation} on settings file currently not supported`
				);
			}
		} else {
			throw new Error(
				"Unimplemented. Only the db.sqlite file can be handled for now."
			);
		}
	},

	diff: {
		file: async ({ old, neu }) => {
			if (neu === undefined) {
				return [];
			}

			if (neu.path?.endsWith(".csv")) {
				/** @type {import("@lix-js/sdk").DiffReport[]} */
				const result: DiffReport[] = [];

				const oldParsed = old
					? papaparse.parse(new TextDecoder().decode(old.data), {
							header: true,
						})
					: undefined;

				const oldColumns = Object.keys(
					(oldParsed?.data[0] as Record<string, string>) || {}
				);
				let uniqueColumn: string = oldColumns[0];
				const oldUniqueColumn = (old as LixFile)?.metadata?.unique_column;
				if (oldUniqueColumn) {
					uniqueColumn = oldUniqueColumn;
				}
				const newUniqueColumn = (neu as LixFile)?.metadata?.unique_column;
				if (newUniqueColumn) {
					uniqueColumn = newUniqueColumn;
				}

				const oldById =
					oldParsed?.data.reduce((agg: Record<string, unknown>, row) => {
						if (!(row as Record<string, string>)[uniqueColumn]) {
							return agg;
						}
						agg[(row as Record<string, string>)[uniqueColumn]] = row;
						return agg;
					}, {}) || {};

				const newParsed = neu
					? papaparse.parse(new TextDecoder().decode(neu.data), {
							header: true,
						})
					: undefined;

				if (newParsed) {
					for (const row of newParsed.data.values() as IterableIterator<
						Record<string, string>
					>) {
						const oldRow = oldById[
							(row as Record<string, string>)[uniqueColumn]
						] as Record<string, string>;

						const isEqual = oldRow ? compareObjects(oldRow, row) : false;
						if (!isEqual) {
							const cols = getChangedKeys(oldRow, row);
							const diff = {
								type: "row",
								operation:
									oldRow && row ? "update" : oldRow ? "delete" : "create",
								old: oldRow as DiffReport["old"],
								neu: row as DiffReport["neu"],
								meta: {
									col_name: JSON.stringify(cols),
								},
							};

							result.push(diff as DiffReport);
						}
					}
				}

				return result;
			} else if (neu.path?.endsWith("_position.json")) {
				if (old === undefined) {
					const diffResult = [
						{
							type: "file",
							operation: "create",
							old,
							neu: {
								id: "-",
								data: JSON.parse(new TextDecoder().decode(neu.data)),
							},
						} satisfies DiffReport,
					];

					return diffResult;
				} else if (JSON.stringify(old) !== JSON.stringify(neu)) {
					return [
						{
							type: "file",
							operation: "update",
							old: {
								id: "-",
								data: JSON.parse(new TextDecoder().decode(old.data)),
							},
							neu: {
								id: "-",
								data: JSON.parse(new TextDecoder().decode(neu.data)),
							},
						} satisfies DiffReport,
					];
				} else {
					return [];
				}
			} else {
				// for all other files we don't detect changes
				return [];
			}
		},
	},

	// diffComponent: {
	// 	// TODO replace async init by bundling static imports
	// 	// @ts-ignore -- return as html element
	// 	cell: async () => {
	// 		/**
	// 		 * @type {import("lit")}
	// 		 */
	// 		const lit = await import(
	// 			// @ts-expect-error - no types
	// 			"http://localhost:5174/lit-all.js"
	// 		);

	// 		const { diffWords } = await import(
	// 			// @ts-expect-error - no types
	// 			"http://localhost:5174/diff.js"
	// 		);

	// 		return class extends lit.LitElement {
	// 			static properties = {
	// 				old: { type: Object },
	// 				neu: { type: Object },
	// 				show: { type: String },
	// 			};

	// 			old;
	// 			neu;
	// 			show;

	// 			// TODO lix css variables for colors
	// 			addedColor = "green";
	// 			removedColor = "red";

	// 			render() {
	// 				console.log("rerender");
	// 				if (this.old === undefined || this.neu === undefined) {
	// 					return lit.html`<span>${this.old?.text ?? this.neu?.text}</span>`;
	// 				}

	// 				const diff = diffWords(this.old.text, this.neu.text);

	// 				return lit.html`
	//           <span>
	//             ${diff.map((part) => {
	// 								if (this.show === "neu" && part.removed) {
	// 									return lit.nothing;
	// 								} else if (this.show === "old" && part.added) {
	// 									return lit.nothing;
	// 								}
	// 								const color = part.added
	// 									? this.addedColor
	// 									: part.removed
	// 										? this.removedColor
	// 										: "black";
	// 								return lit.html`
	//                 <span style="color: ${color}">${part.value}</span>
	//               `;
	// 							})}
	//           </span>
	//         `;
	// 			}
	// 		};
	// 	},
	// },
};

export default plugin;
