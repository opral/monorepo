/* eslint-disable unicorn/no-null */
import { newLixFile } from "../newLix.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { mockCsvPlugin } from "./mock-csv-plugin.js";
import { describe, expect, test } from "vitest";

describe("applyChanges()", () => {
	test("it should apply a create change", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const neu = new TextEncoder().encode(
			"Name,Age\nAnna,20\nPeter,50\nJohn,30",
		);
		const changes = [
			{
				operation: "create",
				value: { rowIndex: 3, columnIndex: 0, text: "John" },
			},
			{
				operation: "create",
				value: { rowIndex: 3, columnIndex: 1, text: "30" },
			},
		];
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const { fileData } = await mockCsvPlugin.applyChanges!({
			file: { id: "mock", path: "x.csv", data: old, metadata: null },
			changes: changes as any,
			lix: {} as any,
		});

		expect(fileData).toEqual(neu);
	});

	test("it should apply an update change", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const neu = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");
		const changes = [
			{
				operation: "update",
				value: { rowIndex: 1, columnIndex: 1, text: "21" },
			},
		];
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const { fileData } = await mockCsvPlugin.applyChanges!({
			file: { id: "mock", path: "x.csv", data: old, metadata: null },
			changes: changes as any,
			lix: {} as any,
		});
		expect(fileData).toEqual(neu);
	});

	test("it should apply a delete change", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\n,50");
		const neu = new TextEncoder().encode("Name,Age\nAnna,20");
		const lix = await openLixInMemory({ blob: await newLixFile() });

		await lix.db
			.insertInto("change")
			.values({
				id: "parent_change_id",
				file_id: "random",
				operation: "create",
				plugin_key: "csv",
				type: "cell",
				// @ts-expect-error - database expects stringified json
				value: JSON.stringify({
					columnIndex: 1,
					rowIndex: 2,
					text: "50",
				}),
			})
			.execute();

		const changes = [
			{
				operation: "delete",
				parent_id: "parent_change_id",
			},
		];
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const { fileData } = await mockCsvPlugin.applyChanges!({
			file: { id: "mock", path: "x.csv", data: old, metadata: null },
			changes: changes as any,
			lix,
		});
		expect(fileData).toEqual(neu);
	});
});

describe("diff.file()", () => {
	test("it should report no changes for identical files", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const neu = old;
		const diffs = await mockCsvPlugin.diff.file?.({
			old: { id: "random", path: "x.csv", data: old, metadata: null },
			neu: { id: "random", path: "x.csv", data: neu, metadata: null },
		});
		expect(diffs).toEqual([]);
	});

	test("it should report a create diff", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const neu = new TextEncoder().encode(
			"Name,Age\nAnna,20\nPeter,50\nJohn,30",
		);
		const diffs = await mockCsvPlugin.diff.file?.({
			old: { id: "random", path: "x.csv", data: old, metadata: null },
			neu: { id: "random", path: "x.csv", data: neu, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				operation: "create",
				old: undefined,
				neu: { rowIndex: 3, columnIndex: 0, text: "John" },
			},
			{
				type: "cell",
				operation: "create",
				old: undefined,
				neu: { rowIndex: 3, columnIndex: 1, text: "30" },
			},
		]);
	});

	test("it should an update diff", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const neu = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");
		const diffs = await mockCsvPlugin.diff.file?.({
			old: { id: "random", path: "x.csv", data: old, metadata: null },
			neu: { id: "random", path: "x.csv", data: neu, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				operation: "update",
				old: { rowIndex: 1, columnIndex: 1, text: "20" },
				neu: { rowIndex: 1, columnIndex: 1, text: "21" },
			},
		]);
	});

	test("it should report a delete diff", async () => {
		const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
		const neu = new TextEncoder().encode("Name,Age\nAnna,20");
		const diffs = await mockCsvPlugin.diff.file?.({
			old: { id: "random", path: "x.csv", data: old, metadata: null },
			neu: { id: "random", path: "x.csv", data: neu, metadata: null },
		});
		expect(diffs).toEqual([
			{
				type: "cell",
				operation: "delete",
				old: { rowIndex: 2, columnIndex: 0, text: "Peter" },
				neu: undefined,
			},
			{
				type: "cell",
				operation: "delete",
				old: { rowIndex: 2, columnIndex: 1, text: "50" },
				neu: undefined,
			},
		]);
	});
});
