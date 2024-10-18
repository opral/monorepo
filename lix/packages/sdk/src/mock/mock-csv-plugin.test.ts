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
		const lix = await openLixInMemory({
			blob: await newLixFile(),
			providePlugins: [mockCsvPlugin],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "x.csv",
				data: before,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		const file = await lix.db
			.updateTable("file")
			.set({ data: after })
			.where("path", "=", "x.csv")
			.returningAll()
			.executeTakeFirstOrThrow();

		await lix.settled();

		const changes = await lix.db.selectFrom("change").selectAll().execute();

		const { fileData } = await mockCsvPlugin.applyChanges!({
			file,
			changes: changes,
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

	test("it detect update changes", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");
		const detectedChanges = await mockCsvPlugin.detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(detectedChanges).toEqual([
			{
				type: "cell",
				entity_id: "1-1",
				snapshot: { rowIndex: 1, columnIndex: 1, text: "21" },
			},
		] satisfies DetectedChange[]);
	});

	test("it should detect a deletion", async () => {
		const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const after = new TextEncoder().encode("Name,Age\nAnna,20");
		const detectedChanges = await mockCsvPlugin.detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata: null },
			after: { id: "random", path: "x.csv", data: after, metadata: null },
		});
		expect(detectedChanges).toEqual([
			{ entity_id: "2-0", type: "cell", snapshot: undefined },
			{ entity_id: "2-1", type: "cell", snapshot: undefined },
		] satisfies DetectedChange[]);
	});
});
