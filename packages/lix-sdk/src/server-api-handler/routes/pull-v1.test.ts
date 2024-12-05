import { test, expect } from "vitest";
import * as LixServerApi from "@lix-js/server-api-schema";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { createServerApiMemoryStorage } from "../storage/create-memory-storage.js";
import { createServerApiHandler } from "../create-server-api-handler.js";
import { mockJsonSnapshot } from "../../snapshot/mock-json-snapshot.js";

type RequestBody =
	LixServerApi.paths["/lsa/pull-v1"]["post"]["requestBody"]["content"]["application/json"];

test("it should fetch all rows from all tables successfully", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Add data to multiple tables
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "test-key-1", value: "test-value-1" },
			{ key: "test-key-2", value: "test-value-2" },
		])
		.execute();

	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [],
			} satisfies RequestBody),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(200);
	const responseJson =
		(await response.json()) as LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"];

	expect(responseJson.data).toBeDefined();

	const keyValueTable = Object.entries(responseJson.data).find(
		(table) => table[0] === "key_value"
	)!;
	expect(keyValueTable).toBeDefined();
	expect(keyValueTable[1].length).toBeGreaterThan(0);
	expect(keyValueTable[1]).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ key: "test-key-1", value: "test-value-1" }),
			expect.objectContaining({ key: "test-key-2", value: "test-value-2" }),
		])
	);
});

test("it should specifically be able to handle snapshots which use json binary and should not transfer the id", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const mockSnapshot = mockJsonSnapshot({
		key: "test-key-1",
		value: "test-value-1",
	});

	// Add data to multiple tables
	await lix.db
		.insertInto("snapshot")
		.values([{ content: mockSnapshot.content }])
		.execute();

	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [],
			} satisfies RequestBody),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(200);
	const responseJson =
		(await response.json()) as LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"];

	expect(responseJson.data).toBeDefined();

	const snapshots = Object.entries(responseJson.data).find(
		(table) => table[0] === "snapshot"
	)!;
	expect(snapshots).toBeDefined();
	expect(snapshots[1].length).toBeGreaterThan(0);
	expect(snapshots[1]).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				// expecting no id
				content: mockSnapshot.content,
			}),
		])
	);
});

test("it should return 404 if the Lix file is not found", async () => {
	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "nonexistent-id",
				vector_clock: [],
			} satisfies RequestBody),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(404);
});

test("it should return 500 if the Lix file is invalid", async () => {
	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-invalid-id`, new Blob(["invalid data"]));

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "invalid-id",
			}),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(500);
	const responseJson = await response.json();
	expect(responseJson.code).toBe("INVALID_LIX_FILE");
	expect(responseJson.message).toBe("The lix file couldn't be opened.");
});

test("it should handle empty tables gracefully", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [],
			} satisfies RequestBody),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(200);
	const responseJson = await response.json();

	expect(responseJson.data).toBeDefined();
	Object.entries(responseJson.data).forEach((table) => {
		expect(table[0]).toBeDefined();
		expect(Array.isArray(table[1])).toBe(true);
	});
});
