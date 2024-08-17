import { mockCsvPlugin } from "./mock-csv-plugin.js";
import { expect, test } from "vitest";

test("it should report no changes for identical files", async () => {
	const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const neu = old;
	const diffs = await mockCsvPlugin.diff.file?.({
		old: { id: "random", path: "x.csv", data: old },
		neu: { id: "random", path: "x.csv", data: neu },
	});
	expect(diffs).toEqual([]);
});

test("it should report a create diff", async () => {
	const old = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const neu = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50\nJohn,30");
	const diffs = await mockCsvPlugin.diff.file?.({
		old: { id: "random", path: "x.csv", data: old },
		neu: { id: "random", path: "x.csv", data: neu },
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
		old: { id: "random", path: "x.csv", data: old },
		neu: { id: "random", path: "x.csv", data: neu },
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
		old: { id: "random", path: "x.csv", data: old },
		neu: { id: "random", path: "x.csv", data: neu },
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
