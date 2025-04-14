import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { changeSetHasLabel } from "../query-filter/change-set-has-label.js";

export function applyVersionV2DatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixDatabaseSchema>
): SqliteWasmDatabase {
	sqlite.createFunction({
		name: "handle_update_working_change_set",
		arity: -1,
		// @ts-expect-error - sqlite wasm type mismatch
		xFunc: (
			_ctx: number,
			id: string,
			change_set_id: string,
			working_change_set_id: string
		) =>
			handleUpdateWorkingChangeSet({
				db,
				sqlite,
				id,
				change_set_id,
				working_change_set_id,
			}),
	});

	// initial ids (lack of having a separate creation and migration schema)
	const mainVersionId = "019328cc-ccb0-7f51-96e8-524df4597ac6";
	const workingChangeSetId = "h2h09ha92jfaw2";
	const initialChangeSetId = "2j9jm90ajc9j90";

	const sql = `
  CREATE TABLE IF NOT EXISTS version_v2 (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT UNIQUE DEFAULT (human_id()),
    change_set_id TEXT NOT NULL,
    working_change_set_id TEXT NOT NULL UNIQUE,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id),
    FOREIGN KEY(working_change_set_id) REFERENCES change_set(id)
  ) STRICT;

  -- only one version can be active at a time
  -- hence, the table has only one row
  CREATE TABLE IF NOT EXISTS active_version (
    version_id TEXT NOT NULL PRIMARY KEY,

    FOREIGN KEY(version_id) REFERENCES version_v2(id)
  ) STRICT;

  -- Insert the default change set if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO change_set (id, immutable_elements)
  SELECT '${initialChangeSetId}', 1
  WHERE NOT EXISTS (SELECT 1 FROM change_set WHERE id = '${initialChangeSetId}');

  -- Insert the default working change set if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO change_set (id, immutable_elements)
  SELECT '${workingChangeSetId}', 0
  WHERE NOT EXISTS (SELECT 1 FROM change_set WHERE id = '${workingChangeSetId}');

  -- Insert the default version if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO version_v2 (id, name, change_set_id, working_change_set_id)
  SELECT '${mainVersionId}', 'main', '${initialChangeSetId}', '${workingChangeSetId}'
  WHERE NOT EXISTS (SELECT 1 FROM version_v2);

  -- Set the default current version to 'main' if both tables are empty
  -- (this is a workaround for not having a separata creation and migration schema's)
  INSERT INTO active_version (version_id)
  SELECT '${mainVersionId}'
  WHERE NOT EXISTS (SELECT 1 FROM active_version);

  CREATE TRIGGER IF NOT EXISTS update_working_change_set 
  AFTER UPDATE OF change_set_id ON version_v2
  FOR EACH ROW
  WHEN OLD.change_set_id != NEW.change_set_id
  BEGIN
    SELECT handle_update_working_change_set(NEW.id, NEW.change_set_id, NEW.working_change_set_id);
  END;
`;

	return sqlite.exec(sql);
}

function handleUpdateWorkingChangeSet(args: {
	db: Kysely<LixDatabaseSchema>;
	sqlite: SqliteWasmDatabase;
	id: string;
	change_set_id: string;
	working_change_set_id: string;
}): boolean {
	// get the new elements
	const newElements = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.selectFrom("change_set_element")
			.where("change_set_element.change_set_id", "=", args.change_set_id)
			.selectAll(),
	});

	for (const element of newElements) {
		// insert the new elements into the working change set
		const [change] = executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db
				.selectFrom("change")
				.where("id", "=", element.change_id)
				.select(["snapshot_id", "id"]),
		}) as [{ snapshot_id: string; id: string }];

		// checking if the entity has been inserted since the last checkpoint.
		//
		// if yes, the entity is removed from the working change set to signal
		// the user "nothing changed since your last checkpoint"
		//
		// if not, the delete change for the entity is explicitly added to the
		// working change set to signal the user "you just deleted something"
		if (change.snapshot_id === "no-content") {
			const [lastCheckpoint] = executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.selectFrom("change_set")
					.where(changeSetIsAncestorOf({ id: args.change_set_id }))
					.where(changeSetHasLabel({ name: "checkpoint" }))
					// note: assumes that sqlite traverses the tree in depth-first order
					// this might not be true in all cases (todo for the future)
					.limit(1)
					.select("change_set.id"),
			}) as [{ id: string } | undefined];

			const [existing] = lastCheckpoint
				? (executeSync({
						lix: { sqlite: args.sqlite },
						query: args.db
							.selectFrom("change_set_element")
							.innerJoin("change", "change.id", "change_set_element.change_id")
							.innerJoin(
								"change_set",
								"change_set.id",
								"change_set_element.change_set_id"
							)
							.where(
								changeSetIsAncestorOf(
									{ id: lastCheckpoint!.id },
									{ includeSelf: true }
								)
							)
							.where("change.entity_id", "=", element.entity_id)
							.where("change.file_id", "=", element.file_id)
							.where("change.schema_key", "=", element.schema_key)
							.where("change.snapshot_id", "!=", "no-content")
							// note: assumes that sqlite traverses the tree in depth-first order
							// this might not be true in all cases (todo for the future)
							.limit(1)
							.select(["change.snapshot_id", "change.id"]),
					}) as [{ snapshot_id: string }])
				: [];
			// if the entity was inserted after the last checkpoint but removed again,
			// delete the entity from the working change set
			if (!existing) {
				executeSync({
					lix: { sqlite: args.sqlite },
					query: args.db
						.deleteFrom("change_set_element")
						.where("change_set_element.entity_id", "=", element.entity_id)
						.where("change_set_element.file_id", "=", element.file_id)
						.where("change_set_element.schema_key", "=", element.schema_key)
						.where(
							"change_set_element.change_set_id",
							"=",
							args.working_change_set_id
						),
				});
				return true;
			}
		}

		executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db
				.insertInto("change_set_element")
				.values({
					...element,
					change_set_id: args.working_change_set_id,
				})
				// if the entity already exists, update the change_id
				.onConflict((oc) =>
					oc.doUpdateSet((eb) => ({
						change_id: eb.ref("excluded.change_id"),
					}))
				),
		});
	}

	return true;
}

export type VersionV2 = Selectable<VersionV2Table>;
export type NewVersionV2 = Insertable<VersionV2Table>;
export type VersionV2Update = Updateable<VersionV2Table>;
export type VersionV2Table = {
	id: Generated<string>;
	name: string | null;
	change_set_id: string;
	working_change_set_id: string;
};

export type ActiveVersion = Selectable<ActiveVersionTable>;
export type NewActiveVersion = Insertable<ActiveVersionTable>;
export type ActiveVersionUpdate = Updateable<ActiveVersionTable>;
export type ActiveVersionTable = {
	version_id: Generated<string>;
};
