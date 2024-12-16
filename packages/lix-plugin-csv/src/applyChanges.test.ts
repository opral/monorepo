import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";
import { changeQueueSettled, openLixInMemory } from "@lix-js/sdk";
import { plugin } from "./index.js";

test("it applies an insert change", async () => {
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
		file: { id: "mock", path: "/mock", metadata },
		fileUpdates: [before, after],
	});

	// TODO changes comming from mock changes contain ALL changes not only the changes from before to after - is this intended?
	// TODO we ignore the ordering of the rows - FYI

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata },
		changes,
		lix,
	});

	expect(applied).toEqual(after);
});

test("it applies an update change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

	const metadata = { unique_column: "Name" };

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "/mock", metadata },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it applies a delete change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20");

	const metadata = { unique_column: "Name" };

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "/mock", metadata },
		fileUpdates: [before, after],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock", data: before, metadata },
		changes,
		lix,
	});
	expect(applied).toEqual(after);
});

test("it applies a row order change", async () => {
	const initial = new TextEncoder().encode(
		//
		"Name,Age\nAnna,20\nPeter,50\nJohn,30",
	);
	const update0 = new TextEncoder().encode(
		// john has been moved to the top
		"Name,Age\nJohn,30\nPeter,50\nAnna,20",
	);

	const metadata = { unique_column: "Name" };

	const { lix, changes } = await mockChanges({
		file: { id: "mock", path: "/mock", metadata },
		fileUpdates: [initial, update0],
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock", data: initial, metadata },
		changes,
		lix,
	});

	expect(applied).toEqual(update0);
});

test("applies changes to a new csv file", async () => {
	const lix = await openLixInMemory({ providePlugins: [plugin] });

	const initialCsv = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");

	const file = {
		id: "file0",
		path: "/mock.csv",
		data: initialCsv,
		metadata: { unique_column: "Name" },
	};

	await lix.db.insertInto("file").values(file).execute();

	await changeQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "file0")
		.selectAll()
		.execute();

	const { fileData: applied } = await applyChanges({
		file: { ...file, data: undefined },
		changes,
		lix,
	});

	expect(applied).toEqual(initialCsv);
}); 