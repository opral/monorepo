import type { paths } from "@lix-js/server-protocol";
import type { Client } from "openapi-fetch";
import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";
import { CompiledQuery } from "kysely";

/**
 * Pushes rows to the server.
 */
export async function pushRowsToServer(args: {
	client: Client<paths>;
	lix: Lix;
	id: string;
	tableNames: Array<keyof LixDatabaseSchema>;
}): Promise<void> {
	await Promise.all(
		args.tableNames.map(async (name) => {
			const rows = await args.lix.db.selectFrom(name).execute();
			const serverQuery = CompiledQuery.raw(
				`INSERT INTO ${name} VALUES ? ON CONFLICT DO NOTHING;`,
				[rows],
			);
			await args.client.POST("/lsp/lix/{id}/query", {
				body: {
					sql: serverQuery.sql,
					parameters: serverQuery.parameters as unknown[],
				},
				params: {
					path: {
						id: args.id,
					},
				},
			});
		}),
	);
}
