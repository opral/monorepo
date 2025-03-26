import { test, expect } from "vitest";
import { createServerProtocolHandler } from "../create-server-protocol-handler.js";
import { newLixFile } from "../../lix/new-lix.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { createLspInMemoryEnvironment } from "../environment/create-in-memory-environment.js";
import { toBlob } from "../../lix/to-blob.js";

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

	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	// Store the lix file
	await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix }),
		})
	);

	// Fetch the lix file
	const response = await lspHandler(
		new Request("http://localhost:3000/lsp/get-v1", {
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
	const environment = createLspInMemoryEnvironment();

	const lspHandler = await createServerProtocolHandler({ environment });

	const response = await lspHandler(
		new Request("http://localhost:3000/lsp/get-v1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ lix_id: "non-existent-id" }),
		})
	);

	const responseJson = await response.json();

	expect(response.status).toBe(404);
	expect(responseJson.error).toBe("Lix not found");
});

test("it should return 400 for a request without lix_id", async () => {
	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	const response = await lspHandler(
		new Request("http://localhost:3000/lsp/get-v1", {
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

test("lix_sync is set to true", async () => {
	const environment = createLspInMemoryEnvironment();
	const lspHandler = await createServerProtocolHandler({ environment });

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		keyValues: [{ key: "lix_sync", value: "false" }],
	});

	// Store the lix file
	const response0 = await lspHandler(
		new Request("http://localhost:3000/lsp/new-v1", {
			method: "POST",
			body: await toBlob({ lix }),
		})
	);

	const id = (await response0.json()).id;

	const response1 = await lspHandler(
		new Request("http://localhost:3000/lsp/get-v1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ lix_id: id }),
		})
	);

	const blob = await response1.blob();

	const lixFromServer = await openLixInMemory({ blob });

	const lixSync = await lixFromServer.db
		.selectFrom("key_value")
		.where("key", "=", "lix_sync")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(lixSync.value).toBe("true");
});
