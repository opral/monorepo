import type { SqliteDatabase } from "sqlite-wasm-kysely";
import {
	handleFileUpdate,
	handleFileInsert,
	handleFileDelete,
} from "./file-handlers.js";
import type { Lix } from "../lix/open-lix.js";

export async function initChangeQueue(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
	rawDatabase: SqliteDatabase;
}): Promise<void> {
	args.rawDatabase.createFunction({
		name: "triggerChangeQueue",
		arity: 0,
		// @ts-expect-error - dynamic function
		xFunc: () => {
			// TODO: abort current running queue?
			queueWorker();
		},
	});

	const closed = false;

	let pending: Promise<void> | undefined;

	let resolve: () => void;
	// run number counts the worker runs in a current batch and is used to prevent race conditions where a trigger is missed because a previous run is just about to reset the hasMoreEntriesSince flag
	let runNumber = 1;
	// If a queue trigger happens during an existing queue run we might miss updates and use hasMoreEntriesSince to make sure there is always a final immediate queue worker execution
	let hasMoreEntriesSince: number | undefined = undefined;

	async function queueWorker(trail = false) {
		if (closed) {
			return;
		}

		try {
			if (pending && !trail) {
				hasMoreEntriesSince = runNumber;
				return;
			}
			runNumber++;

			if (!pending) {
				pending = new Promise((res) => {
					resolve = res;
				});
			}

			const entry = await args.lix.db
				.selectFrom("change_queue")
				.selectAll()
				.orderBy("id asc")
				.limit(1)
				.executeTakeFirst();

			if (entry) {
				if (entry.data_before && entry.data_after) {
					await handleFileUpdate({
						changeQueueEntry: entry,
						lix: args.lix,
					});
				} else if (!entry.data_before && entry.data_after) {
					await handleFileInsert({
						changeQueueEntry: entry,
						lix: args.lix,
					});
				} else {
					await handleFileDelete({
						changeQueueEntry: entry,
						lix: args.lix,
					});
				}
			}

			// console.log("getrting { numEntries }");

			const { numEntries } = await args.lix.db
				.selectFrom("change_queue")
				.select((eb) => eb.fn.count<number>("id").as("numEntries"))
				.executeTakeFirstOrThrow();

			// console.log({ numEntries });

			if (
				!hasMoreEntriesSince ||
				(numEntries === 0 && hasMoreEntriesSince < runNumber)
			) {
				resolve!(); // TODO: fix type
				hasMoreEntriesSince = undefined;
				pending = undefined;
				// console.log("resolving");
			}

			// TODO: handle endless tries on failing quee entries
			// we either execute the queue immediately if we know there is more work or fall back to polling
			setTimeout(() => queueWorker(true), hasMoreEntriesSince ? 0 : 1000);
		} catch (e) {
			console.error("change queue failed ", e);
		}
	}
	// start a worker in case there are entries
	return queueWorker();
}
