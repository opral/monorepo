import { newLixFile } from "../newLix.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { mockCsvPlugin } from "./mock-csv-plugin.js";
import { describe, expect, test } from "vitest";

describe("applyChanges()", () => {
	test("it should apply a create change", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode(
			"Name,Age\nAnna,20\nPeter,50\nJohn,30",
		);
		const changes = [
			{ value: { rowIndex: 3, columnIndex: 0, text: "John" } },
			{ value: { rowIndex: 3, columnIndex: 1, text: "30" } },
		];

		const { fileData } = await mockCsvPlugin.applyChanges!({
			file: { id: "mock", path: "x.csv", data: before, metadata: null },
			changes: changes as any,
			lix: {} as any,
		});

		expect(fileData).toEqual(after);
	});

	test("it should apply an update change", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");
		const changes = [{ value: { rowIndex: 1, columnIndex: 1, text: "21" } }];

		const { fileData } = await mockCsvPlugin.applyChanges!({
			file: { id: "mock", path: "x.csv", data: before, metadata: null },
			changes: changes as any,
			lix: {} as any,
		});
		expect(fileData).toEqual(after);
	});

	test("it should apply a delete change", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\n,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,20");
		const lix = await openLixInMemory({ blob: await newLixFile() });

		await lix.db
			.insertInto("snapshot")
			.values({
				id: "parent_change_snapshot_id",
				// @ts-expect-error - database expects stringified json
				value: JSON.stringify({
					columnIndex: 1,
					rowIndex: 2,
					text: "50",
				}),
			})
			.execute();

		await lix.db
			.insertInto("change")
			.values({
				id: "parent_change_id",
				entity_id: "value1",
				file_id: "random",
				plugin_key: "csv",
				type: "cell",
				snapshot_id: "parent_change_snapshot_id",
			})
			.execute();

		const changes = [{ parent_id: "parent_change_id" }];

		const { fileData } = await mockCsvPlugin.applyChanges!({
			file: { id: "mock", path: "x.csv", data: before, metadata: null },
			changes: changes as any,
			lix,
		});
		expect(fileData).toEqual(after);
	});
});

describe("diff.file()", () => {
	test("it should report no changes for identical files", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = before;
		const diffs = await mockCsvPlugin.diff.file?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(diffs).toEqual([]);
	});

	test("it should report a create diff", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode(
			"Name,Age\nAnna,20\nPeter,50\nJohn,30",
		);
		const diffs = await mockCsvPlugin.diff.file?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				before: undefined,
				after: { rowIndex: 3, columnIndex: 0, text: "John" },
			},
			{
				type: "cell",
				before: undefined,
				after: { rowIndex: 3, columnIndex: 1, text: "30" },
			},
		]);
	});

	test("it should an update diff", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");
		const diffs = await mockCsvPlugin.diff.file?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				before: { rowIndex: 1, columnIndex: 1, text: "20" },
				after: { rowIndex: 1, columnIndex: 1, text: "21" },
			},
		]);
	});

	test("it should report a delete diff", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,20");
		const diffs = await mockCsvPlugin.diff.file?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				before: { rowIndex: 2, columnIndex: 0, text: "Peter" },
				after: undefined,
			},
			{
				type: "cell",
				before: { rowIndex: 2, columnIndex: 1, text: "50" },
				after: undefined,
			},
		]);
	});
});
