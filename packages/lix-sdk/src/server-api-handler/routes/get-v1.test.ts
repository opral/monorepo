import { test, expect } from "vitest";
import { createServerApiHandler } from "../create-server-api-handler.js";
import { createServerApiMemoryStorage } from "../storage/create-memory-storage.js";
import { newLixFile } from "../../lix/new-lix.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";

test("it should fetch the lix file from the server", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("key_value")
		.values({ key: "mock_key", value: "hello world" })
		.execute();

	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	// Store the lix file
	await lsa(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	// Fetch the lix file
	const response = await lsa(
		new Request("http://localhost:3000/lsa/get-v1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ lix_id: id }),
		})
	);

	const blob = await response.blob();

	const lixFromServer = await openLixInMemory({ blob });

	const mockKey = await lixFromServer.db
		.selectFrom("key_value")
		.where("key", "=", "mock_key")
		.selectAll()
		.executeTakeFirstOrThrow();

	const idFromServer = await lixFromServer.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(response.status).toBe(200);
	expect(idFromServer.value).toBe(id);
	expect(mockKey.value).toBe("hello world");
});

test("it should return 404 if the lix file does not exist", async () => {
	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/get-v1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ lix_id: "non-existent-id" }),
		})
	);

	const responseJson = await response.json();

	expect(response.status).toBe(404);
	expect(responseJson.error).toBe("Lix file not found");
});

test("it should return 400 for a request without lix_id", async () => {
	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/get-v1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		})
	);

	const responseJson = await response.json();

	expect(response.status).toBe(400);
	expect(responseJson.error).toBe("Missing required field 'lix_id'");
});
