import type { Lix } from "../lix/open-lix.js";

/**
 * Waits until the file queue is settled.
 *
 * @example
 *   ```ts
 *   await fileQueueSettled({ lix });
 *   ```
 */
export async function fileQueueSettled(args: {
	lix: Pick<Lix, "db">;
}): Promise<void> {
	let hasEntries = true;

	while (hasEntries) {
		const entries = await args.lix.db
			.selectFrom("file_queue")
			.selectAll()
			.limit(1)
			.execute();

		hasEntries = entries.length > 0;

		if (hasEntries) {
			// poll again in 50ms. This is a workaround until subscriptions
			// or another mechanism is implemented to notify when the queue is settled
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}
}
