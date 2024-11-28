import type * as LixServerApi from "@lix-js/server-api-schema";
import type { LixServerApiHandlerRoute } from "../create-server-api-handler.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import type { Lix } from "../../lix/open-lix.js";
import { TO_BE_SYNCED_TABLES } from "../../sync/to-be-synced-tables.js";

type RequestBody =
	LixServerApi.paths["/lsa/pull-v1"]["post"]["requestBody"]["content"]["application/json"];

type ResponseBody = LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"];

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
		// TODO SYNC implement server logic 
		// this returns everything for now. But we should first filter all events from
		// vector_clock that happend after the clients vector clock
		// we can use the same query plus the table to get the data from the column
		const data = await Promise.all(
			TO_BE_SYNCED_TABLES.map(async (table_name) => {
				let query = lix.db.selectFrom(table_name);
				if (table_name === "snapshot") {
					// don't select the generated id column and ignore the no content column
					query = query.select("content").where("id", "!=", "no-content");
				} else {
					query = query.selectAll();
				}
				const rows = await query.execute();
				return { table_name, rows };
			})
		);

		// TODO SYNC make this a helper function
		const sessionStatesServer = await lix.db.selectFrom('vector_clock').select(({ fn, val, ref }) => {
			return ['session', fn.max<number>('session_time').as('time')]
		}).groupBy('session').execute()

		return new Response(
			JSON.stringify({
				vector_clock: sessionStatesServer,
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
