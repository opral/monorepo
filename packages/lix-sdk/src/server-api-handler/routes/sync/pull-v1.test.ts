import { test, expect } from "vitest";
import * as LixServerApi from "@lix-js/server-api-schema";
import { openLixInMemory } from "../../../lix/open-lix-in-memory.js";
import { createServerApiMemoryStorage } from "../../storage/create-memory-storage.js";
import { createServerApiHandler } from "../../create-server-api-handler.js";

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
		new Request("http://localhost:3000/lsa/sync/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(200);
	const responseJson =
		(await response.json()) as LixServerApi.paths["/lsa/sync/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"];

	expect(responseJson.data).toBeDefined();
	const keyValueTable = responseJson.data.find(
		(table: any) => table.table_name === "key_value"
	)!;
	expect(keyValueTable).toBeDefined();
	expect(keyValueTable.rows.length).toBeGreaterThan(0);
	expect(keyValueTable.rows).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ key: "test-key-1", value: "test-value-1" }),
			expect.objectContaining({ key: "test-key-2", value: "test-value-2" }),
		])
	);
});

test("it should return 404 if the Lix file is not found", async () => {
	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/sync/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "nonexistent-id",
			}),
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
		new Request("http://localhost:3000/lsa/sync/pull-v1", {
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
		new Request("http://localhost:3000/lsa/sync/pull-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(200);
	const responseJson = await response.json();

	expect(responseJson.data).toBeDefined();
	responseJson.data.forEach((table: any) => {
		expect(table.rows).toBeDefined();
		expect(Array.isArray(table.rows)).toBe(true);
	});
});
