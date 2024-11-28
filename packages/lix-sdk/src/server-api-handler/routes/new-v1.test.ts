import { test, expect } from "vitest";
import { createServerApiHandler } from "../create-server-api-handler.js";
import { createServerApiMemoryStorage } from "../storage/create-memory-storage.js";
import { newLixFile } from "../../lix/new-lix.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";

test("it should store the lix file in storage", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	const responseJson = await response.json();

	const blob = await storage.get(`lix-file-${id}`);

	const lixFromStorage = await openLixInMemory({ blob });

	expect(blob).toBeDefined();
	expect(response.status).toBe(201);
	expect(responseJson.id).toBe(id);
	expect(lixFromStorage).toBeDefined();
});

// Test is skipped because it works as expected but
// the opening of the lix file is logged as error to
// the console. Requires lix logging system to be
// implemented. Hence, skipped for now.
test.skip("it should return 400 for an invalid lix file", async () => {
	const invalidLixFile = new Blob(["invalid content"]);

	console.error = () => {};

	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: invalidLixFile,
		})
	);

	expect(response.status).toBe(400);
});

test("it should return 409 if the lix file already exists", async () => {
	const lixFile = await newLixFile();

	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	// First request to store the lix file
	await lsa(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: lixFile,
		})
	);

	// Second request to store the same lix file
	const response = await lsa(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: lixFile,
		})
	);

	expect(response.status).toBe(409);
});
