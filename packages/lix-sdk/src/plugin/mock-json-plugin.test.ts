import { expect, test } from "vitest";
import { mockJsonPlugin } from "./mock-json-plugin.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("it handles insert changes", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		})
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
			City: "Berlin",
		})
	);

	// Insert the initial file
	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			path: "/mock.json",
			data: before,
		})
		.execute();

	// Update the file with new data
	await lix.db
		.updateTable("file")
		.set({ data: after })
		.where("id", "=", "mock")
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("file_id", "=", "mock")
		.where("plugin_key", "=", mockJsonPlugin.key)
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();

	const { fileData: applied } = mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after)
	);
});

test("it handles update changes", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			City: "Berlin",
		})
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			City: "New York",
		})
	);

	// Insert the initial file
	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			path: "/mock.json",
			data: before,
		})
		.execute();

	// Update the file with new data
	await lix.db
		.updateTable("file")
		.set({ data: after })
		.where("id", "=", "mock")
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("file_id", "=", "mock")
		.where("plugin_key", "=", mockJsonPlugin.key)
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();

	const { fileData: applied } = mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after)
	);
});

test("it handles delete changes", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			property_to_delete: "value",
		})
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
		})
	);

	// Insert the initial file
	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			path: "/mock.json",
			data: before,
		})
		.execute();

	// Update the file with new data
	await lix.db
		.updateTable("file")
		.set({ data: after })
		.where("id", "=", "mock")
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "mock")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.selectAll("change")
		.where("plugin_key", "=", mockJsonPlugin.key)
		.select("snapshot.content as snapshot_content")
		.execute();

	const { fileData: applied } = await mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after)
	);
});

test("it handles nested properties and arrays", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const before = new TextEncoder().encode(
		JSON.stringify({
			nested: {
				name: "Anna",
				list: ["a", "b", "c"],
			},
		})
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			nested: {
				name: "Peter",
				list: ["a", "b", "c", "d"],
			},
		})
	);

	// Insert the initial file
	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			path: "/mock.json",
			data: before,
		})
		.execute();

	// Update the file with new data
	await lix.db
		.updateTable("file")
		.set({ data: after })
		.where("id", "=", "mock")
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "mock")
		.where("plugin_key", "=", mockJsonPlugin.key)
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();

	const { fileData: applied } = await mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after)
	);
});
