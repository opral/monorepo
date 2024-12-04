import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { createChange } from "../change/create-change.js";

export async function handleLixOwnEntityChange(
	db: Kysely<LixDatabaseSchema>,
	tableName: string,
	...values: any[]
): Promise<void> {
	await db.transaction().execute(async (trx) => {
		const currentVersion = await trx
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const authors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		await createChange({
			lix: { db: trx },
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
	});
	console.log("Change created");
}
