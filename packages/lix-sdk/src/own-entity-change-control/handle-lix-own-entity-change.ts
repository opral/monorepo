import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { createChange } from "../change/create-change.js";

export async function handleLixOwnEntityChange(
	db: Kysely<LixDatabaseSchema>,
	tableName: string,
	...values: any[]
): Promise<void> {
	const currentVersion = await db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const authors = await db.selectFrom("active_account").selectAll().execute();

	await createChange({
		lix: { db },
		authors: authors,
		version: currentVersion,
		entityId: values[0],
		fileId: "null",
		pluginKey: "lix-own-entity",
		schemaKey: "lix-key-value-v1",
		snapshotContent: {
			key: values[0],
			value: values[1],
		},
	});
	console.log("Change created");
}
