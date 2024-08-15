import { expect, test } from "vitest";
import { openLixInMemory } from "./open/openLixInMemory.js";
import { newLixFile } from "./newLix.js";
import type { LixPlugin } from "./plugin.js";
import papaparse from "papaparse";

test("be able to merge two lix files correctly", async () => {
	const mockPlugin: LixPlugin = {
		key: "csv",
		glob: "*.csv",

		merge: {
			file: async ({ current, conflicts, changes }) => {
				// incoming.  fileId
				const currentParsed = current
					? papaparse.parse(new TextDecoder().decode(current), {
							header: true,
						})
					: undefined;

				if (currentParsed === undefined) {
					throw new Error("cannot parse file for merging ");
				}

				const resolved = [];
				const unresolved = [];
				for (const conflict of conflicts) {
					// @ts-ignore
					const { hasConflict, result } = await mockPlugin.merge.cell(conflict);

					result && resolved.push([result]);
					hasConflict && unresolved.push(conflict);
				}

				for (const change of [...changes, ...resolved]) {
					const latestChange = change[0]; // only using latest change for simple merge cases
					const [rowId, columnName] = latestChange.value.id.split("-");

					// TODO: handle insert/ delete row
					const existingRow = currentParsed.data.find(
						(row: any) => row.id === rowId,
					);
					existingRow[columnName] = latestChange.value.text;
				}

				const resultBlob = new TextEncoder().encode(
					papaparse.unparse(currentParsed),
				);

				return { result: resultBlob, unresolved };
			},

			cell: async ({ current, incoming, base }) => {
				// always raise conflicts resolving column "v" for testing
				if (current[0].value.id.endsWith("-v")) {
					const diff = await mockPlugin.diff.cell({
						old: current[0].value,
						neu: incoming[0].value,
					});

					if (diff.length > 0) {
						console.log({ current, incoming, base });
						return { hasConflict: true };
					}
				}

				let chosen;
				// choose latest edit
				if (current[0].created > incoming[0].created) {
					chosen = current[0];
				} else {
					chosen = incoming[0];
				}

				return { result: chosen };
			},
		},

		diff: {
			file: async ({ old, neu }) => {
				/** @type {import("@lix-js/sdk").DiffReport[]} */
				const result = [];

				const oldParsed = old
					? papaparse.parse(new TextDecoder().decode(old.data), {
							header: true,
						})
					: undefined;

				const newParsed = neu
					? papaparse.parse(new TextDecoder().decode(neu.data), {
							header: true,
						})
					: undefined;

				if (newParsed) {
					for (const [i, row] of newParsed.data.entries()) {
						const oldRow = oldParsed?.data[i];
						for (const column in row) {
							const id = `${row.id}-${column}`;

							const diff = await mockPlugin.diff.cell({
								old: oldRow
									? {
											id,
											text: oldRow[column],
										}
									: undefined,
								neu: {
									id,
									text: row[column],
								},
							});

							if (diff.length > 0) {
								result.push(...diff);
							}
						}
					}
				}

				return result;
			},

			// @ts-ignore --  TODO: handle return cases for operation independent
			cell: async ({ old, neu }: { old: any; neu: any }) => {
				if (old?.text === neu?.text) {
					return [];
				} else {
					return [
						{
							type: "cell",
							operation: old && neu ? "update" : old ? "delete" : "create",
							old: old,
							neu: neu
								? {
										id: neu.id,
										text: neu.text,
									}
								: undefined,
						},
					];
				}
			},
		},
	};
	const lixA = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const lixB = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const enc = new TextEncoder();
	await lixA.db
		.insertInto("file")
		.values({
			id: "test",
			path: "test.csv",
			data: enc.encode("id,a,b,c\na1,1,2,3"),
		})
		.execute();

	await lixB.db
		.insertInto("file")
		.values({
			id: "test",
			path: "test.csv",
			data: enc.encode("id,a,b,c\na1,1,2,3"),
		})
		.execute();

	await lixA.settled();

	const changes = await lixA.db.selectFrom("change").selectAll().execute();

	expect(changes).toEqual([
		{
			commit_id: null,
			conflict: null,
			file_id: "test",
			id: changes[0]!.id,
			meta: null,
			operation: "create",
			parent_id: null,
			plugin_key: "csv",
			type: "cell",
			value: {
				id: "a1-id",
				text: "a1",
			},
		},
		{
			commit_id: null,
			conflict: null,
			file_id: "test",
			id: changes[1]!.id,
			meta: null,
			operation: "create",
			parent_id: null,
			plugin_key: "csv",
			type: "cell",
			value: {
				id: "a1-a",
				text: "1",
			},
		},
		{
			commit_id: null,
			conflict: null,
			file_id: "test",
			id: changes[2]!.id,
			meta: null,
			operation: "create",
			parent_id: null,
			plugin_key: "csv",
			type: "cell",
			value: {
				id: "a1-b",
				text: "2",
			},
		},
		{
			commit_id: null,
			conflict: null,
			file_id: "test",
			id: changes[3]!.id,
			meta: null,
			operation: "create",
			parent_id: null,
			plugin_key: "csv",
			type: "cell",
			value: {
				id: "a1-c",
				text: "3",
			},
		},
	]);

	const mergeResult = await lixA
		.merge({
			incommingDb: lixB.db,
			userId: "test user",
		})
		.catch((error) => {
			return { error };
		});

	expect(mergeResult!.error.message).toBe(
		"cannot merge on uncommited changes, pls commit first",
	);

	await lixA.commit({ userId: "tester", description: "test commit" });
	await lixB.commit({ userId: "tester 2", description: "test commit b" });

	const mergeResult2 = await lixA
		.merge({
			incommingDb: lixB.db,
			userId: "test user",
		})
		.catch((error) => {
			return { error };
		});

	expect(mergeResult2!.error.message).toEqual("no common ancestor found");

	const lixC = await openLixInMemory({
		blob: await lixA.toBlob(),
		providePlugins: [mockPlugin],
	});

	const mergeResult3 = await lixA
		.merge({
			incommingDb: lixC.db,
			userId: "test user",
		})
		.catch((error) => {
			return { error };
		});

	expect(mergeResult3).toBe(undefined);

	await lixA.db
		.insertInto("file")
		.values({
			id: "test",
			path: "test.csv",
			data: enc.encode("id,a,b,c\na1,1 changed in a,2 changed in a,3"),
		})
		.execute();

	await lixC.db
		.insertInto("file")
		.values({
			id: "test",
			path: "test.csv",
			data: enc.encode("id,a,b,c\na1,1,2 changed in c,3 changed in c"),
		})
		.execute();

	await lixA.commit({ userId: "tester", description: "test commit 2" });
	await lixC.commit({ userId: "tester 2", description: "test commit 2C" });

	await lixA.settled();

	const mergeResult4 = await lixA
		.merge({
			incommingDb: lixC.db,
			userId: "test user",
		})
		.catch((error) => {
			return { error };
		});

	console.log(mergeResult4);

	// // Test replacing uncommitted changes and multiple changes processing
	// await lix.db
	// 	.updateTable("file")
	// 	.set({ data: enc.encode("test updated text") })
	// 	.where("id", "=", "test")
	// 	.execute();

	// await lix.db
	// 	.updateTable("file")
	// 	.set({ data: enc.encode("test updated text second update") })
	// 	.where("id", "=", "test")
	// 	.execute();

	// const queue2 = await lix.db.selectFrom("change_queue").selectAll().execute();
	// expect(queue2).toEqual([
	// 	{
	// 		id: 2,
	// 		file_id: "test",
	// 		path: "test.txt",
	// 		data: queue2[0]?.data,
	// 	},
	// 	{
	// 		id: 3,
	// 		file_id: "test",
	// 		path: "test.txt",
	// 		data: queue2[1]?.data,
	// 	},
	// ]);

	// await lix.settled();

	// expect(
	// 	(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	// ).toBe(0);

	// const updatedChanges = await lix.db
	// 	.selectFrom("change")
	// 	.selectAll()
	// 	.execute();

	// expect(updatedChanges).toEqual([
	// 	{
	// 		id: updatedChanges[0]?.id!,
	// 		parent_id: null,
	// 		type: "text",
	// 		file_id: "test",
	// 		operation: "update",
	// 		plugin_key: "mock-plugin",
	// 		value: {
	// 			id: "test",
	// 			text: "updated text",
	// 		},
	// 		meta: null,
	// 		commit_id: null,
	// 	},
	// ]);

	//
});
