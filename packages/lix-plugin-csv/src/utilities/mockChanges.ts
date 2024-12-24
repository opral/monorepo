import {
	fileQueueSettled,
	openLixInMemory,
	type Lix,
	type NewLixFile,
} from "@lix-js/sdk";
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
	fileUpdates: Uint8Array[];
}) {
	const lix =
		args.lix ??
		(await openLixInMemory({
			providePlugins: [{ key: "mock", detectChanges, detectChangesGlob: "*" }],
		}));
	for (const update of args.fileUpdates) {
		await lix.db
			.insertInto("file")
			.values({
				id: args.file.id ?? "mock",
				path: args.file.path,
				data: update,
				metadata: args.file.metadata,
			})
			.onConflict((oc) => oc.doUpdateSet({ data: update }))
			.execute();
	}

	await fileQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	return { lix, changes };
}
