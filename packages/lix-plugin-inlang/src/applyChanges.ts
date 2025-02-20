import { type Change, type LixPlugin, type LixReadonly } from "@lix-js/sdk";
import { contentFromDatabase, createInMemoryDatabase, loadDatabaseInMemory } from "sqlite-wasm-kysely";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	// NOTE @samuelstroschein commented out - not needed - handled by the glob in index.ts
	// if (file.path?.endsWith("db.sqlite") === false) {
	// 	throw new Error(
	// 		"Unimplemented. Only the db.sqlite file can be handled for now."
	// 	);
	// }

	// todo make transactional

	// @ts-expect-error -- what is the expected type?
	const sqlite = file.data ? await loadDatabaseInMemory(file.data) : await createInMemoryDatabase({
		readOnly: false,
	});;
	
	const db = initDb({ sqlite });

	// NOTE @samuelstroschein - why do we get the leaf changes here?
	// the award for the most inefficient deduplication goes to...
	// const leafChanges = [
	// 	...new Set(
	// 		await Promise.all(
	// 			changes.map(async (change) => {
	// 				const leafChange = await getLeafChange({ change, lix });
	// 				// enable string comparison to avoid duplicates
	// 				return JSON.stringify(leafChange);
	// 			})
	// 		)
	// 	),
	// ].map((v) => JSON.parse(v));

	// NOTE @samuelstroschein this is because we extract the changes from the file and don't know the order between two saves?
	// changes need to be applied in order of foreign keys to avoid constraint violations
	// 1. bundles
	// 2. messages
	// 3. variants
	const applyOrder: Record<string, number> = {
		bundle: 1,
		message: 2,
		variant: 3,
	};

	// NOTE @samuelstroschein just iterating over changes instead of leaf changes!?
	// future optimization potential here but sorting in one go
	const orderedChanges = [...changes].sort((a, b) => {

		const orderA = applyOrder[a.schema_key];
		const orderB = applyOrder[b.schema_key];

		if (orderA === undefined || orderB === undefined) {
			throw new Error(
				`Received an unknown entity type: ${a.schema_key} && ${
					b.schema_key
				}. Expected one of: ${Object.keys(applyOrder)}`
			);
		}

		return orderA - orderB;
	});
	for (const change of orderedChanges) {

		const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", change.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

		// if (change.schema_key === 'bundle') {
		// } else if (change.schema_key === 'message') {
		// } else if (change.schema_key === 'variant') {
		// } else {
		// 	throw new Error("unknonw schema key " +change.schema_key);
		// }
		

		// deletion
		if (snapshot.content === null) {
			await db
				.deleteFrom(change.schema_key as "bundle" | "message" | "variant")
				.where("id", "=", change.entity_id)
				.execute();
			continue;
		}

		// upsert the value
		const value = snapshot.content as any;

		try {
			await db
				.insertInto(change.schema_key as "bundle" | "message" | "variant")
				.values(value)
				.onConflict((c: any) => c.column("id").doUpdateSet(value))
				.execute();
		} catch (e) {
			// 787 = SQLITE_CONSTRAINT_FOREIGNKEY
			if (e instanceof Error && (e as any)?.resultCode === 787) {
				await handleForeignKeyViolation({ change: change, lix, db });
			} else {
				throw e;
			}
		}
	}
	return { fileData: contentFromDatabase(sqlite) };
};

/**
 * Handles foreign key violations e.g. a change
 * doesn't exist in the target database but is referenced
 * by an entity.
 */
async function handleForeignKeyViolation(args: {
	change: Change;
	lix: LixReadonly;
	db: Kysely<InlangDatabaseSchema>;
}) {
	const lastKnown = async (
		type: "bundle" | "message" | "variant",
		id: string
	) =>
		await args.lix.db
			.selectFrom("change")
			.selectAll()
			// heuristic that getting the last bundle value is fine
			// and using created_at is fine too. if the change is undesired
			// , a user can revert it with lix change control
			.orderBy("created_at desc")
			.where("type", "=", type)
			.where((eb) => eb.ref("value", "->>").key("id"), "=", id)
			.where("operation", "in", ["create", "update"])
			// TODO shouldn't throw. The API needs to be able to
			// report issues back to the app without throwing and potentially failing
			// to apply 1000 changes because 1 change is invalid
			// same requirement as in inlang, see https://github.com/opral/inlang-sdk/issues/213
			.executeTakeFirstOrThrow();

	if (args.change.type === "message") {
		const lastKnownBundle = await lastKnown(
			"bundle",
			args.change.value?.bundleId
		);
		await args.db
			.insertInto("bundle")
			.values(lastKnownBundle.value as any)
			.execute();
	} else if (args.change.type === "variant") {
		const lastKnownMessage = await lastKnown(
			"message",
			args.change.value?.messageId
		);
		// getting the bundle too out of precaution
		const lastKnownBundle = await lastKnown(
			"bundle",
			lastKnownMessage.value?.bundleId
		);
		await args.db
			.insertInto("bundle")
			.values(lastKnownBundle.value as any)
			// the bundle exists, so we can ignore the conflict
			.onConflict((c) => c.doNothing())
			.execute();
		await args.db
			.insertInto("message")
			.values(lastKnownMessage.value as any)
			.execute();
		await args.db
			.insertInto(args.change.type as "bundle" | "message" | "variant")
			.values(args.change.value as any)
			.onConflict((c) => c.column("id").doUpdateSet(args.change.value as any))
			.execute();
	}
	// re-execute applying the change
	await args.db
		.insertInto(args.change.type as "bundle" | "message" | "variant")
		.values(args.change.value as any)
		.onConflict((c) => c.column("id").doUpdateSet(args.change.value as any))
		.execute();
}