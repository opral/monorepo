import { expect, test } from "vitest";
import { mockJsonPlugin } from "./mock-json-plugin.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";

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

	await lix.db
		.insertInto("file")
		.values(
			[before, after].map((data) => ({
				id: "mock",
				path: "/mock.json",
				data,
			}))
		)
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({ data: eb.ref("excluded.data") }))
		)
		.execute();

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "mock")
		.selectAll("change")
		.execute();

	const { fileData: applied } = await mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
		lix,
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
			Age: "New York",
		})
	);

	await lix.db
		.insertInto("file")
		.values(
			[before, after].map((data) => ({
				id: "mock",
				path: "/mock.json",
				data,
			}))
		)
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({ data: eb.ref("excluded.data") }))
		)
		.execute();

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "mock")
		.selectAll("change")
		.execute();

	const { fileData: applied } = await mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
		lix,
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

	await lix.db
		.insertInto("file")
		.values(
			[before, after].map((data) => ({
				id: "mock",
				path: "/mock.json",
				data,
			}))
		)
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({ data: eb.ref("excluded.data") }))
		)
		.execute();

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "mock")
		.selectAll("change")
		.execute();

	const { fileData: applied } = await mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
		lix,
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

	await lix.db
		.insertInto("file")
		.values(
			[before, after].map((data) => ({
				id: "mock",
				path: "/mock.json",
				data,
			}))
		)
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({ data: eb.ref("excluded.data") }))
		)
		.execute();

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "mock")
		.selectAll("change")
		.execute();

	const { fileData: applied } = await mockJsonPlugin.applyChanges!({
		file: { id: "mock", path: "/mock", data: before, metadata: {} },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after)
	);
});
