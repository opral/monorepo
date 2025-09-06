// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// import {
// 	tableIdColumns,
// 	tablesByDepencies,
// } from "../database/mutation-log/database-schema.js";
import type { Lix } from "../lix/open-lix.js";

export type VectorClock = {
	session: string;
	time: number;
}[];

export async function mergeTheirState(args: {
	/**
	 * the lix to merge their state into
	 */
	lix: Pick<Lix, "db">;
	/**
	 * the the vector clock of the lix to merge in
	 */
	sourceVectorClock: VectorClock;
	/**
	 * the data to merge in
	 */
	sourceData: Record<string, Array<any>>;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// console.log(
		// 	"mutations before merge-state....",
		// 	(
		// 		await trx
		// 			.selectFrom("mutation_log")
		// 			.selectAll()
		// 			// .select(({ fn }) => {
		// 			// 	return ["session", fn.max<number>("session_time").as("time")];
		// 			// })
		// 			// .groupBy("session")
		// 			.execute()
		// 	).length
		// );

		const myVectorClock = await trx
			.selectFrom("mutation_log")
			.select(({ fn }) => {
				return ["session", fn.max<number>("session_time").as("time")];
			})
			.where("mutation_log.table_name", "<>", "mutation_log")
			.groupBy("session")
			.execute();

		// console.log("getting my vector clock" + JSON.stringify(myVectorClock));

		// find the clocks in their vector clock that are behind mine
		// (everything after their times happend without their recognition) - and we need to handle last write wins
		const unrecognizedSesionTicks = aheadSessions(
			myVectorClock,
			args.sourceVectorClock
		);

		// console.log(
		// 	"vector ticks they have not seen:" +
		// 		JSON.stringify(unrecognizedSesionTicks)
		// );

		// search  the last updated at time stamp per row of rows with modifications unknown by them
		const moreRecentRowUpdatesUnknownBySource =
			unrecognizedSesionTicks.length === 0
				? []
				: await trx
						.selectFrom("mutation_log")
						.select(({ fn }) => {
							return [
								"table_name",
								"row_id",
								fn.max<number>("wall_clock").as("last_updated_wall_time"),
							];
						})
						.where((eb) => {
							return eb.or(
								unrecognizedSesionTicks.map(({ session, time }) => {
									return eb("session", "=", session).and(
										"session_time",
										">",
										time
									);
								})
							);
						})
						// ignore the trigger flag
						.where("mutation_log.table_name", "<>", "mutation_log")
						.groupBy("row_id")
						.execute();

		// build a lookup map that allow us to get the last update using unknownUpdatesByTableAndRow[tableName]?.[rowId];
		const rowsIUpdatedLast = moreRecentRowUpdatesUnknownBySource.reduce(
			(acc, { table_name, row_id, last_updated_wall_time }) => {
				if (!acc[table_name]) {
					acc[table_name] = {};
				}
				acc[table_name][rowIdToString(table_name, row_id)] =
					last_updated_wall_time;
				return acc;
			},
			{} as Record<string, Record<string, number>>
		);

		// console.log(
		// 	"rowsIUpdatedLast - before last write check:",
		// 	rowsIUpdatedLast
		// );

		const sourceMutationLog = args.sourceData["mutation_log"];
		if (sourceMutationLog === undefined) {
			throw new Error("Missing mutation log in source data");
		}

		// go through operation from the vetor clock and
		// remove entries from the row block list where we have a more recent update
		for (let i = 0; i < sourceMutationLog.length; i++) {
			const opertionInSource = sourceMutationLog[i];

			const tableName = opertionInSource["table_name"] as string;
			const time = opertionInSource["wall_clock"] as number;
			const row_id = rowIdToString(tableName, opertionInSource["row_id"]);
			// TODO SYNC undefined behaviour for two equal last writes -> fall back to session ID order for last write winn
			if (
				rowsIUpdatedLast[tableName] &&
				rowsIUpdatedLast[tableName][row_id] &&
				rowsIUpdatedLast[tableName][row_id] < time
			) {
				delete rowsIUpdatedLast[tableName][row_id];
			}
		}

		// console.log("rowsIUpdatedLast - AFTER last write check:", rowsIUpdatedLast);

		// console.log(
		// 	"mutations before insert....",
		// 	(
		// 		await trx
		// 			.selectFrom("mutation_log")
		// 			.selectAll()
		// 			// .select(({ fn }) => {
		// 			// 	return ["session", fn.max<number>("session_time").as("time")];
		// 			// })
		// 			// .groupBy("session")
		// 			.execute()
		// 	).length
		// );
		// the vector clock table has only imutable data and is append only
		// --> just insert everything
		if (args.sourceData["mutation_log"]) {
			// console.log(
			// 	"inserting mutation log - " + args.sourceData["mutation_log"]!.length
			// );
			for (const row of args.sourceData["mutation_log"]!) {
				await trx
					.insertInto("mutation_log")
					.values(row as any)
					.execute();
				// console.log(
				// 	"mutations after insert....",
				// 	(
				// 		await trx
				// 			.selectFrom("mutation_log")
				// 			.selectAll()
				// 			// .select(({ fn }) => {
				// 			// 	return ["session", fn.max<number>("session_time").as("time")];
				// 			// })
				// 			// .groupBy("session")
				// 			.execute()
				// 	).length
				// );
				// console.log(" mutation log ", row, result);
			}
		}

		await trx
			.insertInto("mutation_log")
			.values({
				session: "mock",
				wall_clock: 0,
				session_time: 0,
				row_id: { ignored: "ignored" },
				table_name: "mutation_log",
				operation: "INSERT",
			})
			.execute();

		// NOTE - dont step forward or set a breakpoint here! debugger crashes :-/
		for (const tableName of tablesByDepencies) {
			//for (const [tableName, tableRows] of Object.entries(args.sourceData)) {
			const tableRows = args.sourceData[tableName];
			if (tableRows === undefined) {
				continue;
			}

			// if (tableRows.length === 0) {
			// 	console.log("no rows for table " + tableName + " received");
			// 	continue;
			// } else {
			// 	console.log(
			// 		"Processing " +
			// 			tableRows.length +
			// 			" rows for table - " +
			// 			tableName +
			// 			" received"
			// 	);
			// }
			//	 - filter only my records (this is the records that i have changed more recently than the changes comming from the push)
			// NOTE - dont step forward or set a breakpoint here! debugger crashes :-/
			for (const row of tableRows) {
				// use a compound id? -
				if (
					rowsIUpdatedLast[tableName]?.[rowIdToString(tableName, row)] ===
					undefined
				) {
					if (tableName === "snapshot") {
						delete row.id;
					}
					const statment = trx
						.insertInto(tableName as any)
						.values(row)
						.onConflict((oc) => {
							// add all id columns to the conflict clause to match the primary key
							for (const idColumn of tableIdColumns[tableName]!) {
								oc = oc.column(idColumn);
							}
							return oc.doUpdateSet(row);
						});
					await statment.execute();
					// console.log(result);
				} else {
					console.log(
						"Row skiped - " + tableName + " - " + rowIdToString(tableName, row)
					);
				}
			}
		}

		// remove the the trigger flag to enable insertation triggers again
		await trx
			.deleteFrom("mutation_log")
			.where("table_name", "=", "mutation_log")
			.execute();

		// console.log(
		// 	"in transaction mutations:",
		// 	(
		// 		await trx
		// 			.selectFrom("mutation_log")
		// 			.selectAll()
		// 			// .select(({ fn }) => {
		// 			// 	return ["session", fn.max<number>("session_time").as("time")];
		// 			// })
		// 			// .groupBy("session")
		// 			.execute()
		// 	).length
		// );
	};
	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}

function aheadSessions(
	mine: Array<{ session: string; time: number }>,
	theirs: Array<{ session: string; time: number }>
): Array<{ session: string; time: number }> {
	const mineSessionMap = new Map(
		mine.map(({ session, time }) => [session, time])
	);
	const theirSessionMap = new Map(
		theirs.map(({ session, time }) => [session, time])
	);

	const aheadSession: Array<{ session: string; time: number }> = [];

	const allSessions = new Set([
		...mineSessionMap.keys(),
		...theirSessionMap.keys(),
	]);

	allSessions.forEach((session) => {
		const myTime = mineSessionMap.get(session);
		const theirTime = theirSessionMap.get(session);

		if (myTime && (theirTime === undefined || myTime > theirTime)) {
			aheadSession.push({ session, time: theirTime ?? 0 });
		}
	});

	return aheadSession;
}

function rowIdToString(
	tableName: string,
	rowId: Record<string, string>
): string {
	const idColumns = tableIdColumns[tableName]!;
	let rowIdString = tableName;
	for (const idColumn of idColumns) {
		if (!rowId[idColumn]) {
			throw new Error(`Missing id column ${idColumn} in row id`);
		}
		rowIdString += `_${rowId[idColumn]}`;
	}
	return rowIdString;
}
