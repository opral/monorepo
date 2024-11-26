import { CompiledQuery } from "kysely";
import { openLixInMemory } from "../../../../lix/open-lix-in-memory.js";
import type { LspRouteHandler } from "../../../create-lsp-handler.js";
import type { Lix } from "../../../../lix/open-lix.js";
import { type paths } from "@lix-js/server-protocol";

type TypedResponse = paths["/lsp/lix/{id}/query"]["post"]["responses"];

export const route: LspRouteHandler = async (context) => {
	const { id } = context.params as { id: string };
	const { sql, parameters } = await context.request.json();

	if (isMutationQuery(sql)) {
		return new Response(
			JSON.stringify({
				code: "MUTATION_QUERY_NOT_ALLOWED",
				message: "Mutation queries are not allowed.",
			} satisfies TypedResponse["400"]["content"]["application/json"]),
			{
				status: 400,
			},
		);
	}

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
			},
		);
	}

	try {
		const result = await lix.db.executeQuery(
			CompiledQuery.raw(sql, parameters),
		);

		return new Response(
			JSON.stringify({
				rows: result.rows,
				num_affected_rows: Number(result.numAffectedRows),
			} satisfies TypedResponse["200"]["content"]["application/json"]),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
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
			},
		);
	}
};

// simple, good enough for now. bulletproof approach is
// to use the kysely ast in the future.
function isMutationQuery(sql: string): boolean {
	const mutationRegex = /^\s*(INSERT|UPDATE)\b/i;
	return mutationRegex.test(sql);
}
