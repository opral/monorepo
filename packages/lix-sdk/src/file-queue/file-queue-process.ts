import {
	handleFileUpdate,
	handleFileInsert,
	handleFileDelete,
} from "./file-handlers.js";
import type { Lix } from "../lix/open-lix.js";

export async function initFileQueueProcess(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
}): Promise<void> {
	args.lix.sqlite.createFunction({
		name: "triggerFileQueue",
		arity: 0,
		// @ts-expect-error - dynamic function
		xFunc: () => {
			// TODO: abort current running queue?
			queueWorker();
		},
	});

	let pending: Promise<void> | undefined;

	let resolve: () => void;
	// run number counts the worker runs in a current batch and is used to prevent race conditions where a trigger is missed because a previous run is just about to reset the hasMoreEntriesSince flag
	let runNumber = 1;
	// If a queue trigger happens during an existing queue run we might miss updates and use hasMoreEntriesSince to make sure there is always a final immediate queue worker execution
	let hasMoreEntriesSince: number | undefined = undefined;

	async function queueWorker(trail = false) {
		try {
			if (args.lix.sqlite.isOpen() === false) {
				return;
			}
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
				.selectFrom("file_queue")
				.selectAll()
				.orderBy("id asc")
				.limit(1)
				.executeTakeFirst();

			if (entry) {
				try {
					if (entry.data_before && entry.data_after) {
						await handleFileUpdate({
							fileQueueEntry: entry,
							lix: args.lix,
						});
					} else if (!entry.data_before && entry.data_after) {
						await handleFileInsert({
							fileQueueEntry: entry,
							lix: args.lix,
						});
					} else {
						await handleFileDelete({
							fileQueueEntry: entry,
							lix: args.lix,
						});
					}
				} catch (err) {
					console.error("Error processing file queue entry:", err);
					// Remove the entry to prevent deadlock even if processing fails
					await args.lix.db
						.deleteFrom("file_queue")
						.where("id", "=", entry.id)
						.execute();
				}
			}

			// console.log("getrting { numEntries }");

			const { numEntries } = await args.lix.db
				.selectFrom("file_queue")
				.select((eb) => eb.fn.count<number>("id").as("numEntries"))
				.executeTakeFirstOrThrow();

			// console.log({ numEntries });

			if (
				!hasMoreEntriesSince ||
				(numEntries === 0 && hasMoreEntriesSince < runNumber)
			) {
				resolve!();
				hasMoreEntriesSince = undefined;
				pending = undefined;
			} else {
				// there are more entries to process
				queueWorker(true);
			}
		} catch (e) {
			// database has been closed, ignore
			if (
				e instanceof Error &&
				(e.message.includes("DB has been closed") ||
					e.message.includes("driver has already been destroyed"))
			) {
				return;
			}
			console.error("file queue failed ", e);
		}
	}
	// start a worker in case there are entries
	queueWorker();
	return;
}
