import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";
import * as LixServerApi from "@lix-js/server-api-schema";
function aheadSessions(
    mine: Array<{ session: string, time: number }>,
    theirs: Array<{ session: string, time: number }>
): Array<{ session: string, time: number }> {
    const mineSessionMap = new Map(mine.map(({ session, time }) => [session, time]));
    const theirSessionMap = new Map(theirs.map(({ session, time }) => [session, time]));

    const aheadSession: Array<{ session: string, time: number }> = [];

    const allSessions = new Set([...mineSessionMap.keys(), ...theirSessionMap.keys()]);

    allSessions.forEach(session => {
        const myTime = mineSessionMap.get(session);
        const theirTime = theirSessionMap.get(session);

		if  (myTime && (theirTime === undefined || myTime > theirTime)) {
			aheadSession.push({ session, time: theirTime ?? 0 });
		}
    });

    return aheadSession;
}

export async function pullFromServer(args: {
	id: string;
	lix: Lix;
	serverUrl: string;
}): Promise<void> {
	// 1. get the current vector clock on the client "sessionStatesKnownByTheClient" and send it to the server
	const sessionStatesClient = await args.lix.db.selectFrom('vector_clock').select(({ fn, val, ref }) => {
		return ['session', fn.max<number>('session_time').as('time')]
	}).groupBy('session').execute()

	const response = await fetch(
		new Request(`${args.serverUrl}/lsa/pull-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: sessionStatesClient,
			} satisfies LixServerApi.paths["/lsa/pull-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);
	const body = await response.json();
	if (response.ok === false) {
		throw new Error(`Failed to pull from server: ${body.code} ${body.message}`);
	}
	const data = (
		body as LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"]
	).data;

	await args.lix.db.transaction().execute(async (trx) => {
		for (const { table_name, rows } of data) {
			if (rows.length > 0) {
				await trx
					.insertInto(table_name as keyof LixDatabaseSchema)
					.values(rows)
					.onConflict((oc) => oc.doNothing())
					.execute();
			}
		}
	});
} 
