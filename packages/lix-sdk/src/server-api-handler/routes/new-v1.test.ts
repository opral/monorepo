import { test, expect } from "vitest";
import { createServerApiHandler } from "../create-server-api-handler.js";
import { createServerApiMemoryStorage } from "../storage/create-memory-storage.js";
import { newLixFile } from "../../lix/new-lix.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { createLsaInMemoryEnvironment } from "../environment/create-in-memory-environment.js";

test("it should store the lix file", async () => {
	const initLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const initLixId = await initLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	const environment = createLsaInMemoryEnvironment();

	const lsaHandler = await createServerApiHandler({ storage, environment });

	const response = await lsaHandler(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: await initLix.toBlob(),
		})
	);
	const json = await response.json();

	expect(response.status).toBe(201);
	expect(json.id).toBe(initLixId.value);

	const hasLix = await environment.hasLix({ id: initLixId.value });

	expect(hasLix).toBe(true);

	const open = await environment.openLix({
		id: initLixId.value,
	});

	const lixId = await open.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(lixId.value).toEqual(initLixId.value);

	await environment.closeLix({
		id: initLixId.value,
		connectionId: open.connectionId,
	});
});

// Test is skipped because it works as expected but
// the opening of the lix file is logged as error to
// the console. Requires lix logging system to be
// implemented. Hence, skipped for now.
test.skip("it should return 400 for an invalid lix file", async () => {
	const invalidLixFile = new Blob(["invalid content"]);

	console.error = () => {};

	const storage = createServerApiMemoryStorage();
	const environment = createLsaInMemoryEnvironment();

	const lsaHandler = await createServerApiHandler({ storage, environment });

	const response = await lsaHandler(
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
	const environment = createLsaInMemoryEnvironment();

	const lsaHandler = await createServerApiHandler({ storage, environment });

	// First request to store the lix file
	await lsaHandler(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: lixFile,
		})
	);

	// Second request to store the same lix file
	const response = await lsaHandler(
		new Request("http://localhost:3000/lsa/new-v1", {
			method: "POST",
			body: lixFile,
		})
	);

	expect(response.status).toBe(409);
});
