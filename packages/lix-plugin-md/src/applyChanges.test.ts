import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChangesMd } from "./utilities/mockChanges.js";
import { fileQueueSettled, openLixInMemory } from "@lix-js/sdk";
import { plugin } from "./index.js";

test("it applies an insert change in markdown", async () => {
	const before = new TextEncoder().encode("# Title\n\nHello world.");
	const after = new TextEncoder().encode(
		"# Title\n\nHello world.\n\nNew paragraph.",
	);

	const { lix, changes } = await mockChangesMd({
		file: { id: "mock", path: "/mock.md" },
		fileUpdates: [before, after],
	});

	const { fileData: afterWithIds } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: after, metadata: {} },
		changes: [],
		lix,
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: before, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(afterWithIds),
	);
});

test("it applies a text update in markdown", async () => {
	const before = new TextEncoder().encode("# Title\n\nHello world.");
	const after = new TextEncoder().encode("# Title\n\nHello everyone.");

	const { lix, changes } = await mockChangesMd({
		file: { id: "mock", path: "/mock.md" },
		fileUpdates: [before, after],
	});

	const { fileData: afterWithIds } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: after, metadata: {} },
		changes: [],
		lix,
	});
	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: before, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(afterWithIds),
	);
});

test("it applies a delete change in markdown", async () => {
	const before = new TextEncoder().encode(
		"# Title\n\nHello world.\n\nGoodbye!",
	);
	const after = new TextEncoder().encode("# Title\n\nHello world.");

	const { lix, changes } = await mockChangesMd({
		file: { id: "mock", path: "/mock.md" },
		fileUpdates: [before, after],
	});
	const { fileData: afterWithIds } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: after, metadata: {} },
		changes: [],
		lix,
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: before, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(afterWithIds),
	);
});

test("it applies a reordering change in markdown", async () => {
	const before = new TextEncoder().encode(
		"# Title\n\nParagraph 1.\n\nParagraph 2.",
	);
	const after = new TextEncoder().encode(
		"# Title\n\nParagraph 2.\n\nParagraph 1.",
	);

	const { lix, changes } = await mockChangesMd({
		file: { id: "mock", path: "/mock.md" },
		fileUpdates: [before, after],
	});
	const { fileData: afterWithIds } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: after, metadata: {} },
		changes: [],
		lix,
	});

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "/mock.md", data: before, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(afterWithIds),
	);
});

test("applies changes to a new markdown file", async () => {
	const lix = await openLixInMemory({ providePlugins: [plugin] });

	const initialMd = new TextEncoder().encode(`<!-- id: abc123-1 -->
# Heading

<!-- id: abc123-2 -->
Some text.`);

	const file = {
		id: "file0",
		path: "/mock.md",
		data: initialMd,
	};

	await lix.db.insertInto("file").values(file).execute();

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "file0")
		.selectAll()
		.execute();

	const { fileData: applied } = await applyChanges({
		file: { ...file, data: undefined, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(initialMd),
	);
});

test("applies changes to a new markdown file in correct order", async () => {
	const lix = await openLixInMemory({ providePlugins: [plugin] });

	const initialMd = new TextEncoder().encode(`<!-- id: abc123-1 -->
# Heading

<!-- id: abc123-2 -->
Some text.`);

	const file = {
		id: "file0",
		path: "/mock.md",
		data: initialMd,
	};

	await lix.db.insertInto("file").values(file).execute();

	const updatedMd = new TextEncoder().encode(`<!-- id: abc123-1 -->
# Heading

<!-- id: abc123-3 -->
Some text - added later in the middel.
<!-- id: abc123-2 -->
Some text.`);

	const fileUpdated = {
		id: "file0",
		path: "/mock.md",
		data: updatedMd,
	};

	await lix.db
		.updateTable("file")
		.set("data", updatedMd)
		.where("id", "=", fileUpdated!.id)
		.returningAll()
		.execute();

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "file0")
		.selectAll()
		.execute();

	const { fileData: applied } = await applyChanges({
		file: { ...file, data: undefined, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(updatedMd),
	);
	console.log("test");
});
