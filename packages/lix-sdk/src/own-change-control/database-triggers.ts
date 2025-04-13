import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type {
	Change,
	LixDatabaseSchema,
	Snapshot,
} from "../database/schema.js";
import {
	changeControlledTableIds,
	entityIdForRow,
	type PragmaTableInfo,
} from "./change-controlled-tables.js";
import { executeSync } from "../database/execute-sync.js";
import { createChange } from "../change/create-change.js";
import type { Account } from "../account/database-schema.js";

export const LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID =
	"pending-own-change-control";

export function applyOwnChangeControlTriggers(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixDatabaseSchema>
): void {
	const tableInfos: Record<string, PragmaTableInfo> = {};
	let isFlushing = false;

	for (const table of Object.keys(changeControlledTableIds)) {
		tableInfos[table] = sqlite.exec({
			sql: `PRAGMA table_info(${table});`,
			returnValue: "resultRows",
			rowMode: "object",
		}) as PragmaTableInfo;
	}

	sqlite.createFunction({
		name: "handle_lix_own_change_control",
		arity: -1,
		// @ts-expect-error - dynamic function
		xFunc: (
			_ctx: number,
			tableName: keyof typeof changeControlledTableIds,
			operation: "insert" | "update" | "delete",
			...value
		) => {
			return handleLixOwnChange(
				db,
				sqlite,
				tableName,
				tableInfos,
				operation,
				...value
			);
		},
	});

	for (const table of Object.keys(changeControlledTableIds)) {
		const tableInfo = tableInfos[table]!;

		// Define the common WHEN clause to check for global skip flags.
		// Trigger should run ONLY if none of the skip conditions are met.
		const commonSkipCheck = `NOT (
			EXISTS (SELECT 1 FROM key_value WHERE key IN (
				'lix_skip_own_change_control',
				'lix_flushing_own_changes',
				'lix_skip_handle_own_change_trigger',
				'lix_updating_working_change_set'
			))
		)`;

		// Base WHEN clauses, starting with the common check
		let insertWhenClause = `WHEN ${commonSkipCheck}`;
		let updateWhenClause = `WHEN ${commonSkipCheck}`;
		// deleteWhenClause is not modified after this, so use const
		const deleteWhenClause = `WHEN ${commonSkipCheck}`;

		// Add table-specific WHEN clauses
		if (table === "key_value") {
			// For key_value, also check the skip_change_control column of the row itself
			insertWhenClause += ` AND NEW.skip_change_control IS NOT TRUE`;
			updateWhenClause += ` AND NEW.skip_change_control IS NOT TRUE`;
			// Delete trigger doesn't need this specific check as the row is gone,
			// but we might still want to record the deletion unless a global flag is set.
		}

		if (table === "file") {
			// For file, check its own skip flag
			// For file updates, ONLY trigger if columns *other than* 'data' have changed.
			updateWhenClause += ` AND (
			  OLD.id IS NOT NEW.id OR
				OLD.path IS NOT NEW.path OR 
				OLD.metadata IS NOT NEW.metadata
			)`;
			// Delete trigger doesn't need column checks.
		}

		try {
			sqlite.exec(`
					CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_insert
					AFTER INSERT ON ${table}
					${insertWhenClause}
					BEGIN
						SELECT handle_lix_own_change_control('${table}', 'insert', ${tableInfo.map((c) => "NEW." + c.name).join(", ")});
					END;

					CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_update
					AFTER UPDATE ON ${table}
					${updateWhenClause}
					BEGIN
						SELECT handle_lix_own_change_control('${table}', 'update', ${tableInfo.map((c) => "NEW." + c.name).join(", ")});
					END;

					CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_delete
					AFTER DELETE ON ${table}
					${deleteWhenClause}
					BEGIN
						SELECT handle_lix_own_change_control('${table}', 'delete', ${tableInfo.map((c) => "OLD." + c.name).join(", ")});
					END;
			`);
		} catch {
			// ignore errors during trigger setup
		}
	}

	// Add trigger to move system changes before version change_set_id update
	//
	// Coming up with this took a long time AKA this has been evaluated against other options.
	// Other options included:
	//
	// Have a "flush" mechanism
	//    - needs manual invocation from devs (really bad)
	//    - automatic flush using sqlite's `commit` hook runs out of transaction (bad)
	sqlite.exec(`
    CREATE TEMP TRIGGER IF NOT EXISTS flush_system_changes_before_version_update
    BEFORE UPDATE OF change_set_id ON version_v2
    BEGIN
      INSERT OR REPLACE INTO key_value (key, value, skip_change_control)
      VALUES ('lix_flushing_own_changes', 'true', true);

      -- ensure new change_set exists and is mutable
			UPDATE change_set SET immutable_elements = false WHERE id = NEW.change_set_id;


      -- move pending elements
      INSERT INTO change_set_element (change_set_id, change_id, entity_id, file_id, schema_key)
      SELECT NEW.change_set_id, change_id, entity_id, file_id, schema_key
      FROM change_set_element
      WHERE change_set_id = '${LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID}';

      -- mark new change_set as immutable
      UPDATE change_set
      SET immutable_elements = true
      WHERE id = NEW.change_set_id;

      -- delete pending elements and pending change_set
      DELETE FROM change_set_element WHERE change_set_id = '${LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID}';
      DELETE FROM change_set WHERE id = '${LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID}';

      -- delete the flushing flag
      DELETE FROM key_value WHERE key = 'lix_flushing_own_changes';
    END;
  `);

	// fallback flush on commit if system changes were never finalized
	sqlite.sqlite3.capi.sqlite3_commit_hook(
		sqlite,
		() => {
			if (isFlushing) return 0;
			queueMicrotask(() => {
				isFlushing = true;
				try {
					const pending = sqlite.exec(
						`SELECT 1 FROM change_set_element WHERE change_set_id = '${LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID}' LIMIT 1`,
						{
							returnValue: "resultRows",
						}
					);
					if (pending.length === 0) return;

					sqlite.exec(`
          INSERT OR REPLACE INTO key_value (key, value, skip_change_control)
          VALUES ('lix_flushing_own_changes', 'true', true);

          INSERT INTO change_set (immutable_elements)
          VALUES (true);

          INSERT INTO change_set_edge (parent_id, child_id)
          SELECT change_set_id, (SELECT id FROM change_set ORDER BY rowid DESC LIMIT 1)
          FROM version_v2
          WHERE id = (SELECT version_id FROM active_version)
          AND change_set_id IN (
            SELECT id FROM change_set WHERE immutable_elements = true
          );

          UPDATE version_v2
          SET change_set_id = (SELECT id FROM change_set ORDER BY rowid DESC LIMIT 1)
          WHERE id = (SELECT version_id FROM active_version);

          DELETE FROM key_value WHERE key = 'lix_flushing_own_changes';
        `);
				} finally {
					isFlushing = false;
				}
			});
			return 0;
		},
		0
	);
}

function handleLixOwnChange(
	db: Kysely<LixDatabaseSchema>,
	sqlite: SqliteWasmDatabase,
	tableName: keyof typeof changeControlledTableIds,
	tableInfos: Record<keyof typeof changeControlledTableIds, PragmaTableInfo>,
	operation: "insert" | "update" | "delete",
	...values: any[]
): void {
	const lix = { db, sqlite };

	// key values that have skip_change_control set to true should not be change controlled
	// { tableName: "key_value", skipChangeControl: true }
	// This handles the explicit case where a key *itself* has skip_change_control set
	//
	// for unknown reasons this double check is needed because
	// setting `lix_skip_handle_own_change_trigger` bypasses the when
	// clause of the trigger
	if (tableName === "key_value" && values[2]) {
		return;
	}

	const entityId = entityIdForRow(tableName, ...values);

	const authors = executeSync({
		lix,
		query: db.selectFrom("active_account").selectAll(),
	}) as Account[];

	if (authors.length === 0) {
		throw new Error("At least one author is required");
	}

	let snapshotContent: Snapshot["content"] | null;

	if (operation === "delete") {
		snapshotContent = null;
	} else {
		snapshotContent = {};
		// construct the values as json for the snapshot
		for (const [index, column] of tableInfos[tableName]!.entries()) {
			snapshotContent[column.name] = values[index];
		}
	}

	if (tableName === "file" && snapshotContent) {
		// sqlite has it's own jsonb format
		// hence, need to query sqlite to convert
		// to json
		const json = sqlite.exec("SELECT json(?)", {
			bind: [snapshotContent.metadata],
			returnValue: "resultRows",
		})[0]![0];

		snapshotContent["metadata"] = JSON.parse(json as string);

		// remove the data field which is change controlled by plugins, not lix itself
		delete snapshotContent.data;
	}

	// avoid a loop of own changes
	// entails that we manually need to create all necessary changes
	executeSync({
		lix,
		query: db.insertInto("key_value").values({
			key: "lix_skip_handle_own_change_trigger",
			value: "true",
			skip_change_control: true,
		}),
	});

	const insertedChange = createChange({
		lix,
		authors,
		entityId,
		fileId: "lix_own_change_control",
		pluginKey: "lix_own_change_control",
		schemaKey: `lix_${tableName}_table`,
		snapshotContent,
	}) as unknown as Change;

	executeSync({
		lix,
		query: db
			.insertInto("change_set")
			.values({
				id: LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID,
				immutable_elements: false,
			})
			.onConflict((oc) => oc.doNothing()),
	});

	executeSync({
		lix,
		query: db
			.insertInto("change_set_element")
			.values([
				{
					change_set_id: LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID,
					change_id: insertedChange.id,
					entity_id: insertedChange.entity_id,
					file_id: insertedChange.file_id,
					schema_key: insertedChange.schema_key,
				},
			])
			.onConflict((oc) =>
				oc.doUpdateSet((eb) => ({ change_id: eb.ref("excluded.change_id") }))
			),
	});

	executeSync({
		lix,
		query: db
			.deleteFrom("key_value")
			.where("key", "=", "lix_skip_handle_own_change_trigger"),
	});
}
