import { changeIsLeafOf, type LixPlugin } from "@lix-js/sdk";
import {
	contentFromDatabase,
	createInMemoryDatabase,
	loadDatabaseInMemory,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";
import { CompiledQuery } from "kysely";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	const sqlite = file.data
		? // @ts-expect-error -- what is the expected type?
			await loadDatabaseInMemory(file.data)
		: await createInMemoryDatabase({
				readOnly: false,
			});

	// init and apply the schema
	const db = initDb({ sqlite });

	// await the transaction to finish
	await db.transaction().execute(async (trx) => {
		// defer foreign keys in the current transaction
		await trx.executeQuery(
			CompiledQuery.raw("PRAGMA defer_foreign_keys = ON;")
		);

		// We only apply the leafchanges
		// - since lix doesn't provide the changes in order
		// - fetching all snapshots for all changes will become costy
		// the award for the most inefficient deduplication goes to... (comment by @samuelstroschein)
		const leafChanges = [
			...new Set(
				await Promise.all(
					changes.map(async (change) => {
						const leafChange = await lix.db
							.selectFrom("change")
							.where(changeIsLeafOf({ id: change.id }))
							.selectAll()
							.execute();
						// enable string comparison to avoid duplicates
						return JSON.stringify(leafChange);
					})
				)
			),
		].map((v) => JSON.parse(v));

		// changes need to be applied in order of foreign keys to avoid constraint violations
		// 1. bundles
		// 2. messages
		// 3. variants
		const applyOrder: Record<string, number> = {
			bundle: 1,
			message: 2,
			variant: 3,
		};

		// future optimization potential here but sorting in one go
		const orderedLeafChanges = [...leafChanges].sort((a, b) => {
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
		for (const change of orderedLeafChanges) {
			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", change.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			// deletion
			if (snapshot.content === null) {
				await trx
					.deleteFrom(change.schema_key as "bundle" | "message" | "variant")
					.where("id", "=", change.entity_id)
					.execute();
				continue;
			}

			// upsert the value
			const value = snapshot.content as any;

			await trx
				.insertInto(change.schema_key as "bundle" | "message" | "variant")
				.values(value)
				.onConflict((c: any) => c.column("id").doUpdateSet(value))
				.execute();
		}
	});

	return { fileData: contentFromDatabase(sqlite) };
};

////////////////////////////////////////////////////////////////////////////////////////////
// NOTE: this code was commented out - it solved foreign key violations - reason unclear ///
////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Handles foreign key violations e.g. a change
 * doesn't exist in the target database but is referenced
 * by an entity.
 */
// async function handleForeignKeyViolation(args: {
// 	change: Change;
// 	lix: LixReadonly;
// 	db: Kysely<InlangDatabaseSchema>;
// }) {
// 	throw new Error("Not implemented - check out the comment below if you run into this");
// 	const lastKnown = async (
// 		type: "bundle" | "message" | "variant",
// 		id: string
// 	) =>
// 		await args.lix.db
// 			.selectFrom("change")
// 			.selectAll()
// 			// heuristic that getting the last bundle value is fine
// 			// and using created_at is fine too. if the change is undesired
// 			// , a user can revert it with lix change control
// 			.orderBy("created_at desc")
// 			.where("type", "=", type)
// 			.where((eb) => eb.ref("value", "->>").key("id"), "=", id)
// 			.where("operation", "in", ["create", "update"])
// 			// TODO shouldn't throw. The API needs to be able to
// 			// report issues back to the app without throwing and potentially failing
// 			// to apply 1000 changes because 1 change is invalid
// 			// same requirement as in inlang, see https://github.com/opral/inlang-sdk/issues/213
// 			.executeTakeFirstOrThrow();

// 	if (args.change.type === "message") {
// 		const lastKnownBundle = await lastKnown(
// 			"bundle",
// 			args.change.value?.bundleId
// 		);
// 		await args.db
// 			.insertInto("bundle")
// 			.values(lastKnownBundle.value as any)
// 			.execute();
// 	} else if (args.change.type === "variant") {
// 		const lastKnownMessage = await lastKnown(
// 			"message",
// 			args.change.value?.messageId
// 		);
// 		// getting the bundle too out of precaution
// 		const lastKnownBundle = await lastKnown(
// 			"bundle",
// 			lastKnownMessage.value?.bundleId
// 		);
// 		await args.db
// 			.insertInto("bundle")
// 			.values(lastKnownBundle.value as any)
// 			// the bundle exists, so we can ignore the conflict
// 			.onConflict((c) => c.doNothing())
// 			.execute();
// 		await args.db
// 			.insertInto("message")
// 			.values(lastKnownMessage.value as any)
// 			.execute();
// 		await args.db
// 			.insertInto(args.change.type as "bundle" | "message" | "variant")
// 			.values(args.change.value as any)
// 			.onConflict((c) => c.column("id").doUpdateSet(args.change.value as any))
// 			.execute();
// 	}
// 	// re-execute applying the change
// 	await args.db
// 		.insertInto(args.change.type as "bundle" | "message" | "variant")
// 		.values(args.change.value as any)
// 		.onConflict((c) => c.column("id").doUpdateSet(args.change.value as any))
// 		.execute();
// }
