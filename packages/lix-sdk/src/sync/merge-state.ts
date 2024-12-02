import type { Lix } from "../lix/open-lix.js";

export type VectorClock = {
	session: string;
	time: number;
}[];

export async function mergeTheirState(args: {
	/**
	 * the lix to merge their state into
	 */
	lix: Lix;
	/**
	 * the the vector clock of the lix to merge in
	 */
	sourceVectorClock: VectorClock;
	/**
	 * the data to merge in
	 */
	sourceData: Record<string, Array<any>>;
}): Promise<void> {
	return await args.lix.db.transaction().execute(async (trx) => {
		const myVectorClock = await trx
			.selectFrom("mutation_log")
			.select(({ fn }) => {
				return ["session", fn.max<number>("session_time").as("time")];
			})
			.groupBy("session")
			.execute();

		// find the clocks in their vector clock that are behind mine
		// (everything after their times happend without their recognition) - and we need to handle last write wins
		// TODO SYNC - taff naming :-/
		const unrecognizedSesionTicks = aheadSessions(
			myVectorClock,
			args.sourceVectorClock
		);

		// search  the last updated at time stamp per row of rows with modifications unknown by them
		const rowsUpdateUnknownByServer =
			unrecognizedSesionTicks.length === 0
				? []
				: await trx
						.selectFrom("mutation_log")
						.select(({ fn }) => {
							return [
								"table_name",
								"row_id",
								fn.max<number>("wall_clock").as("las_updated_wall_time"),
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
						.groupBy("row_id")
						.execute();

		// build a lookup map that allow us to get the last update using unknownUpdatesByTableAndRow[tableName]?.[rowId];
		const rowsIUpdatedLast = rowsUpdateUnknownByServer.reduce(
			(acc, { table_name, row_id, las_updated_wall_time }) => {
				if (!acc[table_name]) {
					acc[table_name] = {};
				}
				acc[table_name][row_id] = las_updated_wall_time;
				return acc;
			},
			{} as Record<string, Record<string, number>>
		);

		// go through operation from the vetor clock and
		// remove entries from the row block list where their have a more recent update

		for (const opertionOnTheServer of args.sourceData["mutation_log"]!) {
			const tableName = opertionOnTheServer["table_name"] as string;
			const time = opertionOnTheServer["session_time"] as number;
			const row_id = opertionOnTheServer["row_id"] as string;
			// TODO SYNC undefined behaviour for two equal last writes -> fall back to session ID order for last write winn
			if (
				rowsIUpdatedLast[tableName]?.[row_id] &&
				rowsIUpdatedLast[tableName]?.[row_id] < time
			) {
				delete rowsIUpdatedLast[tableName]?.[row_id];
			}
		}

		const tablesWithId = [
			"account",
			"file",
			"change",
			"snapshot",
			"change_conflict",
			"change_set",
			"discussion",
			"comment",
			"label",
			"version",
			"current_version",
		];

		for (const [table_name, rows] of Object.entries(args.sourceData)) {
			if (rows.length === 0) continue;

			if (table_name === "mutation_log") {
				// the vector clock table has only imutable data and is append only
				// --> just insert everything
				for (const row of rows) {
					await trx
						.insertInto(table_name)
						// TODO SYNC how shall we deal with types here?
						// TODO SYNC - why is eslint not complaining about any anymore???
						.values(row as any)
						.onConflict((oc) => oc.doNothing())
						.execute();
				}
			} else {
				if (tablesWithId.includes(table_name)) {
					//	 - filter only my records (this is the records that i have changed more recently than the changes comming from the push)
					for (const row of rows) {
						if (
							rowsIUpdatedLast[table_name]?.[row.id as string] === undefined
						) {
							await trx
								// TODO SYNC how shall we deal with types here?
								// TODO SYNC - why is eslint not complaining about any anymore???
								.insertInto(table_name as any)
								.values(row)
								.onConflict((oc) => oc.column("id").doUpdateSet(row))
								.execute();
						}
					}
				} else if (table_name === "key_value") {
					// account -> PRIMARY KEY (key)
					for (const row of rows) {
						if (
							rowsIUpdatedLast[table_name]?.[row.key as string] === undefined
						) {
							await trx
								// TODO SYNC how shall we deal with types here?
								// TODO SYNC - why is eslint not complaining about any anymore???
								.insertInto("key_value")
								.values(row)
								.onConflict((oc) => oc.column("key").doUpdateSet(row))
								.execute();
						}
					}
				} else {
					// TODO SYNC -> handle table with composite primary keys
					// Open question do we need to implement each type because of the oncoflict clausE?
					// .onConflict((oc) => oc.column("id").doUpdateSet(row))
					// change_author -> PRIMARY KEY (change_id, account_id),
					// change_edge -> PRIMARY KEY (parent_id, child_id),
					// change_conflict_resolution -> PRIMARY KEY(change_conflict_id, resolved_change_id),
					// change_set_element -> PRIMARY KEY(change_set_id, change_id),
					// change_set_label -> PRIMARY KEY(label_id, change_set_id)
					// change_set_label_author -> PRIMARY KEY(label_id, change_set_id, account_id),
					// version_change_conflict -> PRIMARY KEY (version_id, change_conflict_id),
				}
			}
		}
	});
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
