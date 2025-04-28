// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { Lix } from "../lix/open-lix.js";
import type { VectorClock } from "./merge-state.js";

export async function getDiffingRows(args: {
	/**
	 * the lix to merge their state into
	 */
	lix: Pick<Lix, "db">;
	/**
	 * the the vector clock of the lix to merge in
	 */
	targetVectorClock: VectorClock;
}): Promise<{
	state: any;
	upsertedRows: Record<string, any[]>;
}> {
	const upsertedRows: Record<string, any[]> = {};

	let state: VectorClock = [];

	const executeInTransaction = async (trx: Lix["db"]) => {
		state = await trx
			.selectFrom("mutation_log")
			.select(({ fn }) => {
				return ["session", fn.max<number>("session_time").as("time")];
			})
			.groupBy("session")
			.execute();
		// use the target vector clock to collect all changed rows the target is not aware of
		let operationsToPush = trx
			.selectFrom("mutation_log")
			.selectAll("mutation_log");

		if (args.targetVectorClock.length > 0) {
			operationsToPush = operationsToPush.where((eb) => {
				const knownSessions = args.targetVectorClock.map(
					(sessionTime) => sessionTime.session
				);

				const ors: any[] = [];
				ors.push(eb("session", "not in", knownSessions));
				for (const sessionTime of args.targetVectorClock) {
					ors.push(
						eb("session", "=", sessionTime.session).and(
							"session_time",
							">",
							sessionTime.time
						)
					);
				}

				return eb.or(ors) as any;
			});
		}

		upsertedRows["mutation_log"] = await operationsToPush.execute();

		// console.log("upsertedRows", upsertedRows);

		for (const operation of upsertedRows["mutation_log"]) {
			const tableName = operation.table_name;
			if (upsertedRows[tableName] === undefined) {
				upsertedRows[tableName] = [];
			}
			if (tableName === "snapshot") {
				// ignore inserted column id
				upsertedRows[tableName].push(
					await trx
						.selectFrom(tableName)
						.selectAll()
						.where("id", "=", operation.row_id["id"])
						.executeTakeFirstOrThrow()
				);
			} else {
				let diffRow = trx.selectFrom(tableName).selectAll();

				for (const [key, value] of Object.entries(operation.row_id)) {
					diffRow = diffRow.where(key, "=", value);
				}

				upsertedRows[tableName].push(await diffRow.executeTakeFirstOrThrow());
			}
		}
	};

	if (args.lix.db.isTransaction) {
		await executeInTransaction(args.lix.db);
	} else {
		await args.lix.db.transaction().execute(executeInTransaction);
	}

	return {
		state,
		upsertedRows,
	};
}
