import { openLixInMemory, type Lix, type NewLixFile } from "@lix-js/sdk";
import { detectChanges } from "../detectChanges.js";

/**
 * Instantiates a Lix instance with a mock plugin with the detectChanges function.
 *
 * @example
 *   ```
 *   const mock = await mockChanges({ ... })
 *   const applied = await detectChanges(mock)
 *   ```
 */
export async function mockChanges(args: {
	lix?: Lix;
	file: Omit<NewLixFile, "data">;
	fileUpdates: ArrayBuffer[];
}) {
	const lix =
		args.lix ??
		(await openLixInMemory({
			providePlugins: [{ key: "mock", detectChanges, detectChangesGlob: "*" }],
		}));
	for (const update of args.fileUpdates) {
		try {
			await lix.db
				.insertInto("file")
				.values({
					id: args.file.id ?? "mock",
					path: args.file.path,
					data: update,
					// @ts-expect-error - type error with metadata
					metadata: JSON.stringify(args.file.metadata),
				})
				.execute();
		} catch {
			// because the file table is a view, upserts via sql are not possible
			// manually updating to circumvent the problem.
			// https://linear.app/opral/issue/LIXDK-102/re-visit-simplifying-the-change-queue-implementation
			await lix.db
				.updateTable("file")
				.set("data", update)
				.where("path", "=", args.file.path)
				.execute();
		}
	}

	await lix.settled();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	return { lix, changes };
}
