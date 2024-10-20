import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";

test("it should apply an insert change", async () => {
	const before = new TextEncoder().encode(
		//
		"Name,Age\nAnna,20\nPeter,50",
	);
	const after = new TextEncoder().encode(
		// John, 30 is added between Anna and Peter
		"Name,Age\nAnna,20\nPeter,50\nJohn,30",
	);

	const metadata = { unique_column: "Name" };

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "mock", metadata },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "mock", data: before, metadata },
		changes,
		lix,
	});

	expect(applied).toEqual(after);
});

test("it should apply an update change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

	const metadata = { unique_column: "Name" };

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "mock", metadata },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "mock", data: before, metadata },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it should apply a delete change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20");

	const metadata = { unique_column: "Name" };

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "mock", metadata },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "mock", data: before, metadata },
		changes,
		lix,
	});
	expect(applied).toEqual(after);
});

