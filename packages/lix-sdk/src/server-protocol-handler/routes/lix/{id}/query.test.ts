import { test, expect } from "vitest";
import { openLixInMemory } from "../../../../lix/open-lix-in-memory.js";
import { createLspHandlerMemoryStorage } from "../../../storage/create-memory-storage.js";
import { createLspHandler } from "../../../create-lsp-handler.js";
import type { paths } from "@lix-js/server-protocol";
import type { KeyValue } from "../../../../key-value/database-schema.js";

test("it should execute a SELECT SQL query successfully", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createLspHandlerMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsp = await createLspHandler({ storage });

	const response = await lsp(
		new Request(`http://localhost:3000/lsp/lix/${id}/query`, {
			method: "POST",
			body: JSON.stringify({
				sql: "SELECT * FROM key_value",
				parameters: [],
			}),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);

	const responseJson = await response.json();

	expect(response.status).toBe(200);
	expect(responseJson.rows).toBeDefined();
	expect(responseJson.num_affected_rows).toBeDefined();
});

test("it should execute an INSERT, UPDATE query", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createLspHandlerMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsp = await createLspHandler({ storage });

	const response = await lsp(
		new Request(`http://localhost:3000/lsp/lix/${id}/query`, {
			method: "POST",
			body: JSON.stringify({
				sql: "INSERT INTO key_value (key, value) VALUES ('test', 'test') RETURNING *",
				parameters: [],
			}),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);
	const json =
		(await response.json()) as paths["/lsp/lix/{id}/query"]["post"]["responses"]["201"]["content"]["application/json"];

	expect(response.status).toBe(201);
	expect(json.rows?.length).toBe(1);
	expect(json.num_affected_rows).toBe(1);
	expect((json.rows?.[0] as KeyValue)?.key).toBe("test");
});

test("it should return 400 for an invalid SQL query", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createLspHandlerMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsp = await createLspHandler({ storage });

	// Silence console.error for this test
	const originalConsoleError = console.error;
	console.error = () => {};

	const response = await lsp(
		new Request(`http://localhost:3000/lsp/lix/${id}/query`, {
			method: "POST",
			body: JSON.stringify({
				sql: "INVALID SQL QUERY",
				parameters: [],
			}),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);

	// Restore console.error after the test
	console.error = originalConsoleError;

	expect(response.status).toBe(400);
});

test("it should return 404 if the Lix file is not found", async () => {
	const storage = createLspHandlerMemoryStorage();
	const lsp = await createLspHandler({ storage });

	const response = await lsp(
		new Request("http://localhost:3000/lsp/lix/nonexistent-id/query", {
			method: "POST",
			body: JSON.stringify({
				sql: "SELECT * FROM key_value",
				parameters: [],
			}),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);

	expect(response.status).toBe(404);
});
