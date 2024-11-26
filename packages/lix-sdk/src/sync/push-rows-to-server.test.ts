import { expect, test, vi } from "vitest";
import { createLspHandler } from "../server-protocol-handler/create-lsp-handler.js";
import { createLspHandlerMemoryStorage } from "../server-protocol-handler/storage/create-memory-storage.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type * as LixServerProtocol from "@lix-js/server-protocol";
import { pushRowsToServer } from "./push-rows-to-server.js";
import type { LixFile } from "../database/schema.js";
import type { Account } from "../account/database-schema.js";
import { newLixFile } from "../lix/new-lix.js";
import type { KeyValue } from "../key-value/database-schema.js";

test("push rows of multiple tables to server successfully", async () => {
	const lixBlob = await newLixFile();

	const lix = await openLixInMemory({ blob: lixBlob });

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createLspHandlerMemoryStorage();
	const lspHandler = await createLspHandler({ storage });

	global.fetch = vi.fn((request) => lspHandler(request));

	// initialize the lix on the server
	await lspHandler(
		new Request("http://localhost:3000/lsp/new", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	// insert an account locally
	await lix.db
		.insertInto("account")
		.values({ id: "account0", name: "some account" })
		.execute();

	// inserting into another table to test if multiple tables are pushed to server
	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock-key",
			value: "mock-value",
		})
		.execute();

	await pushRowsToServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
		tableNames: ["account", "key_value"],
	});

	const keyValueOnServerResponse = await fetch(
		new Request(`http://localhost:3000/lsp/lix/${id}/query`, {
			method: "POST",
			body: JSON.stringify({
				sql: "SELECT * FROM key_value WHERE key = 'mock-key';",
			}),
		})
	);

	const accountsOnServerResponse = await fetch(
		new Request(`http://localhost:3000/lsp/lix/${id}/query`, {
			method: "POST",
			body: JSON.stringify({
				sql: "SELECT * FROM account WHERE id = 'account0';",
			}),
		})
	);

	const keyValueOnServer =
		(await keyValueOnServerResponse.json()) as LixServerProtocol.paths["/lsp/lix/{id}/query"]["post"]["responses"]["200"]["content"]["application/json"];

	const accountsOnServer =
		(await accountsOnServerResponse.json()) as LixServerProtocol.paths["/lsp/lix/{id}/query"]["post"]["responses"]["200"]["content"]["application/json"];

	expect(accountsOnServer?.rows).toEqual([
		{ id: "account0", name: "some account" } satisfies Account,
	]);
	expect(keyValueOnServer?.rows).toEqual([
		{
			key: "mock-key",
			value: "mock-value",
		},
	] satisfies KeyValue[]);
});

test.todo("it should handle binary values", async () => {
	const lixBlob = await newLixFile();

	const lix = await openLixInMemory({ blob: lixBlob });

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createLspHandlerMemoryStorage();
	const lspHandler = await createLspHandler({ storage });

	global.fetch = vi.fn((request) => lspHandler(request));

	// initialize the lix on the server
	await lspHandler(
		new Request("http://localhost:3000/lsp/new", {
			method: "POST",
			body: await lix.toBlob(),
		})
	);

	// inserting file with binary data
	await lix.db
		.insertInto("file")
		.values({
			id: "file0",
			path: "/hello.txt",
			data: new TextEncoder().encode("Hello, World!"),
		})
		.execute();

	await pushRowsToServer({
		id,
		lix,
		serverUrl: "http://localhost:3000",
		tableNames: ["file"],
	});

	const filesOnServerResponse = await fetch(
		new Request(`http://localhost:3000/lsp/lix/${id}/query`, {
			method: "POST",
			body: JSON.stringify({
				sql: "SELECT * FROM file WHERE id = 'file0';",
			}),
		})
	);

	const filesOnServer =
		(await filesOnServerResponse.json()) as LixServerProtocol.paths["/lsp/lix/{id}/query"]["post"]["responses"]["200"]["content"]["application/json"];

	expect(filesOnServer?.rows).toEqual([
		{
			id: "file0",
			path: "/hello.txt",
			metadata: null,
			data: new TextEncoder().encode("Hello, World!"),
		} satisfies LixFile,
	]);
});
