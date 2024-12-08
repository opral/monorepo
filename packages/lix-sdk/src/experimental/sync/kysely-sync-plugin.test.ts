import { Kysely, sql } from "kysely";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { expect, test, vi } from "vitest";
import { SyncPlugin } from "./kysely-sync-plugin.js";
import type { paths } from "@lix-js/server-protocol";

test("select queries execute against the server", async () => {
	const database = await createInMemoryDatabase({ readOnly: false });

	const db = new Kysely<any>({
		dialect: createDialect({
			database,
		}),
		plugins: [SyncPlugin()],
	});

	// mock the fetch function and simulate a lsp response
	global.fetch = vi.fn(
		async () =>
			new Response(
				JSON.stringify({
					// server has two rows
					rows: [{ id: 1 }, { id: 2 }],
					num_affected_rows: 2,
				} satisfies paths["/lsp/lix/{id}/query"]["post"]["responses"]["200"]["content"]["application/json"]),
				{ status: 200 },
			),
	);

	await sql`CREATE TABLE mock_table (id INTEGER PRIMARY KEY);`.execute(db);
	// client has only 1 row
	await sql`INSERT INTO mock_table (id) VALUES (1);`.execute(db);

	const result = await db.selectFrom("mock_table").selectAll().execute();

	expect(global.fetch).toHaveBeenCalledOnce();
	expect(result).toEqual([{ id: 1 }, { id: 2 }]);
});

test("if the remote query failed, the local query should be returned as fallback", async () => {
	const database = await createInMemoryDatabase({ readOnly: false });

	const db = new Kysely<any>({
		dialect: createDialect({
			database,
		}),
		plugins: [SyncPlugin()],
	});

	// mock the fetch function and simulate a lsp response
	global.fetch = vi.fn(async () => {
		throw new Error("Failed to execute query against server.");
	});

	await sql`CREATE TABLE mock_table (id INTEGER PRIMARY KEY);`.execute(db);
	// client has 1 row
	await sql`INSERT INTO mock_table (id) VALUES (1);`.execute(db);

	const result = await db.selectFrom("mock_table").selectAll().execute();

	expect(global.fetch).toHaveBeenCalledOnce();
	// fallback to local query
	expect(result).toEqual([{ id: 1 }]);
});
