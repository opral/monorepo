import { CompiledQuery } from "kysely";
import { openLixInMemory } from "../../../../lix/open-lix-in-memory.js";
import type { LixServerApiHandlerRoute } from "../../../create-server-api-handler.js";
import type { Lix } from "../../../../lix/open-lix.js";
import type * as LixServerApi from "@lix-js/server-api-schema";

type TypedResponse =
	LixServerApi.paths["/lsa/lix/{id}/query"]["post"]["responses"];

export const route: LixServerApiHandlerRoute = async (context) => {
	const { id } = context.params as { id: string };
	const { sql, parameters } = await context.request.json();

	const blob = await context.storage.get(`lix-file-${id}`);

	if (!blob) {
		return new Response(null, { status: 404 });
	}

	let lix: Lix;

	try {
		lix = await openLixInMemory({ blob });
	} catch {
		return new Response(
			JSON.stringify({
				code: "INVALID_LIX_FILE",
				message: "The lix file couldn't be opened.",
			} satisfies TypedResponse["500"]["content"]["application/json"]),
			{
				status: 500,
			}
		);
	}

	try {
		const result = await lix.db.executeQuery(
			CompiledQuery.raw(sql, parameters)
		);

		if (Number(result.numAffectedRows) > 0) {
			// write lix file to storage
			// TODO will need handling for concurrent writes
			await context.storage.set(`lix-file-${id}`, await lix.toBlob());
		}

		return new Response(
			JSON.stringify({
				rows: result.rows,
				num_affected_rows: Number(result.numAffectedRows),
			} satisfies TypedResponse["200"]["content"]["application/json"]),
			{
				status: Number(result.numAffectedRows) === 0 ? 200 : 201,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				code: "INVALID_SQL_QUERY",
				message: (error as any)?.message,
			} satisfies TypedResponse["400"]["content"]["application/json"]),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};
