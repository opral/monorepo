import { test, expect } from "vitest";
import { createServerProtocolHandler } from "../create-server-protocol-handler.js";
import { newLixFile } from "../../lix/new-lix.js";
import { openLix } from "../../lix/open-lix.js";
import { createLspInMemoryEnvironment } from "../environment/create-in-memory-environment.js";

test.skip("it should store the lix file", async () => {
	const initLix = await openLix({
		blob: await newLixFile(),
	});

	const initLixId = (await initLix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow()) as { value: string };

	const environment = createLspInMemoryEnvironment();

	const lspHandler = await createServerProtocolHandler({ environment });

	const response = await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
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

	const environment = createLspInMemoryEnvironment();

	const lspHandler = await createServerProtocolHandler({ environment });

	const response = await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: invalidLixFile,
		})
	);

	expect(response.status).toBe(400);
});

test.skip("it should return 409 if the lix file already exists", async () => {
	const lixFile = await newLixFile();

	const environment = createLspInMemoryEnvironment();

	const lspHandler = await createServerProtocolHandler({ environment });

	// First request to store the lix file
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: lixFile,
		})
	);

	// Second request to store the same lix file
	const response = await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: lixFile,
		})
	);

	expect(response.status).toBe(409);
});
