import type * as LixServerApi from "@lix-js/server-api-schema";
import type { LixServerApiHandlerRoute } from "../create-server-api-handler.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import type { Lix } from "../../lix/open-lix.js";
import { mergeTheirState } from "../../sync/merge-state.js";

type RequestBody =
	LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"];

type ResponseBody = LixServerApi.paths["/lsa/push-v1"]["post"]["responses"];

export const route: LixServerApiHandlerRoute = async (context) => {
	const body = (await context.request.json()) as RequestBody;
	const blob = await context.storage.get(`lix-file-${body.lix_id}`);

	if (!blob) {
		return new Response(null, { status: 404 });
	}

	let lix: Lix;

	try {
		lix = await openLixInMemory({ blob, sync: false });
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
		console.log(
			"----------- PROCESSING PUSH FROM CLIENT  --s----------- with state:",
			body.vector_clock
		);
		await mergeTheirState({
			lix,
			sourceVectorClock: body.vector_clock,
			sourceData: body.data,
		});

		const allmlog = await lix.db
			.selectFrom("mutation_log")
			.selectAll()
			// .select(({ fn }) => {
			// 	return ["session", fn.max<number>("session_time").as("time")];
			// })
			// .groupBy("session")
			.execute();

		const vcAfterPush = await lix.db
			.selectFrom("mutation_log")
			.select(({ fn }) => {
				return ["session", fn.max<number>("session_time").as("time")];
			})
			.groupBy("session")
			.execute();

		await context.storage.set(`lix-file-${body.lix_id}`, await lix.toBlob());

		console.log(
			"----------- DONE PROCESSING PUSH FROM CLIENT  ---- ---------",
			vcAfterPush,
			allmlog.length
		);
		return new Response(null, {
			status: 201,
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				code: "FAILED_TO_INSERT_DATA",
				message: (error as any)?.message,
			} satisfies ResponseBody["400"]["content"]["application/json"]),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};
