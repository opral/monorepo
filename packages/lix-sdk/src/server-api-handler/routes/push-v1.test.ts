import { test, expect } from "vitest";
import * as LixServerApi from "@lix-js/server-api-schema";
import { createServerApiMemoryStorage } from "../storage/create-memory-storage.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { createServerApiHandler } from "../create-server-api-handler.js";
import type { Change } from "../../database/schema.js";
import { mockChange } from "../../change/mock-change.js";

test("it should push data successfully", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsa = await createServerApiHandler({ storage });

	const mockChange0 = mockChange({ id: "change0" });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [
					{
						session: "fake-session",
						time: 1,
					},
				],
				data: {
					mutation_log: [
						{
							row_id: { id: mockChange0.id },
							table_name: "change",
							operation: "insert",
							session: "fake-session",
							session_time: 2,
							wall_clock: 1,
						},
					],
					change: [mockChange0] satisfies Change[],
				},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(201);

	const lixFromStorage = await openLixInMemory({
		blob: await storage.get(`lix-file-${id}`),
	});

	const result = await lixFromStorage.db
		.selectFrom("change")
		.where("id", "=", mockChange0.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual(mockChange0);
});

test("it should return 404 if the Lix file is not found", async () => {
	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "nonexistent-id",
				vector_clock: [],
				data: {},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(404);
});

test("it should return 500 for an invalid Lix file", async () => {
	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-invalid-id`, new Blob(["invalid data"]));

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "invalid-id",
				vector_clock: [],
				data: {},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
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

test("it should return 400 for a failed insert operation", async () => {
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
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [],
				data: {
					nonexistent_table: [{ key: "test", value: "test value" }],
				},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(400);
	const responseJson = await response.json();
	expect(responseJson.code).toBe("FAILED_TO_INSERT_DATA");
	expect(responseJson.message).toBeDefined();
});
