import { newLixFile } from "../newLix.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import type { DetectedChange } from "../plugin.js";
import { mockCsvPlugin } from "./mock-csv-plugin.js";
import { describe, expect, test } from "vitest";

describe("applyChanges()", () => {
	test("it should apply a create change", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode(
			"Name,Age\nAnna,20\nPeter,50\nJohn,30",
		);
		const changes = [
			{ content: { rowIndex: 3, columnIndex: 0, text: "John" } },
			{ content: { rowIndex: 3, columnIndex: 1, text: "30" } },
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
		const changes = [{ content: { rowIndex: 1, columnIndex: 1, text: "21" } }];

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

		const snapshot = await lix.db
			.insertInto("snapshot")
			.values({
				// @ts-expect-error - database expects stringified json
				content: JSON.stringify({
					columnIndex: 1,
					rowIndex: 2,
					text: "50",
				}),
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("change")
			.values({
				id: "parent_change_id",
				entity_id: "value1",
				file_id: "random",
				plugin_key: "csv",
				type: "cell",
				snapshot_id: snapshot.id,
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

describe("detectChanges()", () => {
	test("it should report no changes for identical files", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = before;
		const changes = await mockCsvPlugin.detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(changes).toEqual([]);
	});

	test("it should report a create diff", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode(
			"Name,Age\nAnna,20\nPeter,50\nJohn,30",
		);
		const changes = await mockCsvPlugin.detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(changes).toEqual([
			{
				entity_id: "3-0",
				type: "cell",
				snapshot: { rowIndex: 3, columnIndex: 0, text: "John" },
			},
			{
				entity_id: "3-1",
				type: "cell",
				snapshot: { rowIndex: 3, columnIndex: 1, text: "30" },
			},
		] satisfies DetectedChange[]);
	});

	test("it should an update diff", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");
		const diffs = await mockCsvPlugin.detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				entity_id: "1-1",
				snapshot: { rowIndex: 1, columnIndex: 1, text: "21" },
			},
		] satisfies DetectedChange[]);
	});

	test("it should report a delete diff", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,20");
		const diffs = await mockCsvPlugin.detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(diffs).toEqual([
			{ entity_id: "2-0", type: "cell", snapshot: undefined },
			{ entity_id: "2-1", type: "cell", snapshot: undefined },
		] satisfies DetectedChange[]);
	});
});
