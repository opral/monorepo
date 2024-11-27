import type * as LixServerApi from "@lix-js/server-api-schema";
import type { LixServerApiHandlerRoute } from "../../create-server-api-handler.js";
import { openLixInMemory } from "../../../lix/open-lix-in-memory.js";
import type { Lix } from "../../../lix/open-lix.js";
import { TO_BE_SYNCED_TABLES } from "../../../sync/to-be-synced-tables.js";

type RequestBody =
	LixServerApi.paths["/lsa/sync/pull-v1"]["post"]["requestBody"]["content"]["application/json"];

type ResponseBody =
	LixServerApi.paths["/lsa/sync/pull-v1"]["post"]["responses"];

export const route: LixServerApiHandlerRoute = async (context) => {
	const body = (await context.request.json()) as RequestBody;
	const blob = await context.storage.get(`lix-file-${body.lix_id}`);

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
			} satisfies ResponseBody["500"]["content"]["application/json"]),
			{
				status: 500,
			}
		);
	}

	try {
		const data = await Promise.all(
			TO_BE_SYNCED_TABLES.map(async (table_name) => {
				const rows = await lix.db.selectFrom(table_name).selectAll().execute();
				return { table_name, rows };
			})
		);

		return new Response(
			JSON.stringify({
				data,
			} satisfies ResponseBody["200"]["content"]["application/json"]),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				code: "FAILED_TO_FETCH_DATA",
				message: (error as any)?.message,
			} satisfies ResponseBody["500"]["content"]["application/json"]),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};
