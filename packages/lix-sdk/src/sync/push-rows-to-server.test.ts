import { expect, test, vi } from "vitest";
import { createLspHandler } from "../server-protocol-handler/create-lsp-handler.js";
import { createLspHandlerMemoryStorage } from "../server-protocol-handler/storage/create-memory-storage.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { paths } from "@lix-js/server-protocol";
import type { Client } from "openapi-fetch";
import { pushRowsToServer } from "./push-rows-to-server.js";
import createClient from "openapi-fetch";
import type { LixFile } from "../database/schema.js";
import type { Account } from "../account/database-schema.js";

test("push rows of multiple tables to server successfully", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createLspHandlerMemoryStorage();
	const lspHandler = await createLspHandler({ storage });

	const mockFetch = vi.fn(lspHandler);

	const client: Client<paths> = createClient<paths>({
		baseUrl: "http://localhost",
		fetch: mockFetch,
	});

	// initialize server with lix file
	await client.POST("/lsp/new", {
		body: await lix.toBlob(),
	});

	// insert an account locally
	await lix.db
		.insertInto("account")
		.values({ id: "account0", name: "some account" })
		.execute();

	// inserting into another table to test if multiple tables are pushed to server
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
		client,
		tableNames: ["account", "file"],
	});

	const accountsOnServer = await client.POST("/lsp/lix/{id}/query", {
		body: {
			sql: "SELECT * FROM account WHERE id = 'account0';",
		},
		params: {
			path: {
				id,
			},
		},
	});

	const filesOnServer = await client.POST("/lsp/lix/{id}/query", {
		body: {
			sql: "SELECT * FROM file WHERE id = 'file0';",
		},
		params: {
			path: {
				id,
			},
		},
	});

	expect(accountsOnServer.data?.rows).toEqual([
		{ id: "account0", name: "some account" } satisfies Account,
	]);
	expect(filesOnServer.data?.rows).toEqual([
		{
			id: "file0",
			path: "/hello.txt",
			metadata: null,
			data: new TextEncoder().encode("Hello, World!"),
		} satisfies LixFile,
	]);
});
