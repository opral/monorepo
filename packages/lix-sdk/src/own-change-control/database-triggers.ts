import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixDatabaseSchema, Snapshot } from "../database/schema.js";
import type { Kysely } from "kysely";
import {
	changeControlledTableIds,
	entityIdForRow,
	type PragmaTableInfo,
} from "./change-controlled-tables.js";
import { createChange } from "../change/create-change.js";
import { executeSync } from "../database/execute-sync.js";

export function applyOwnChangeControlTriggers(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixDatabaseSchema>
): void {
	const tableInfos: Record<string, PragmaTableInfo> = {};

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
			return handleLixOwnEntityChange(
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

		const sql = `
      CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_insert
      AFTER INSERT ON ${table}
      BEGIN
        SELECT handle_lix_own_change_control('${table}', 'insert', ${tableInfo.map((c) => "NEW." + c.name).join(", ")});
      END;
      
      CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_update
      AFTER UPDATE ON ${table}
			${
				// ignore update trigger if the change controlled properties
				// did not change (a plugin likely called apply changes on the file.data)
				table === "file"
					? `
			WHEN (
				OLD.id IS NOT NEW.id OR
				OLD.path IS NOT NEW.path OR
				OLD.metadata IS NOT NEW.metadata
			)`
					: ""
			}
      BEGIN
        SELECT handle_lix_own_change_control('${table}', 'update', ${tableInfo.map((c) => "NEW." + c.name).join(", ")});
      END;

      CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_delete
      AFTER DELETE ON ${table}
      BEGIN
        SELECT handle_lix_own_change_control('${table}', 'delete', ${tableInfo.map((c) => "OLD." + c.name).join(", ")});
      END;
      `;

		sqlite.exec(sql);
	}
}

function handleLixOwnEntityChange(
	db: Kysely<LixDatabaseSchema>,
	sqlite: SqliteWasmDatabase,
	tableName: keyof typeof changeControlledTableIds,
	tableInfos: Record<keyof typeof changeControlledTableIds, PragmaTableInfo>,
	operation: "insert" | "update" | "delete",
	...values: any[]
): void {
	const lix = { db, sqlite };

	// key values that have skip_change_control set to true should not be change controlled
	if (tableName === "key_value" && values[2]) {
		return;
	}

	const shouldSkip =
		executeSync({
			lix,
			query: db
				.selectFrom("key_value")
				.where("key", "=", "lix_skip_own_change_control")
				.select("value"),
		})[0]?.value === "true";

	if (shouldSkip) {
		return;
	}

	// need to break the loop if own changes are detected
	const change = executeSync({
		lix,
		query: db
			.selectFrom("change")
			.where("id", "=", values[0])
			.select("plugin_key"),
	})[0];

	if (change?.plugin_key === "lix_own_change_control") {
		return;
	}

	const currentVersion = executeSync({
		lix,
		query: db
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll("version"),
	})[0];

	const authors = executeSync({
		lix,
		query: db.selectFrom("active_account").selectAll(),
	});

	if (authors.length === 0) {
		console.error(tableName, change);
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

	const entityId = entityIdForRow(tableName, ...values);

	const insertedChange = createChange(
		{
			lix,
			authors: authors,
			version: currentVersion,
			entityId,
			fileId: "lix_own_change_control",
			pluginKey: "lix_own_change_control",
			schemaKey: `lix_${tableName}_table`,
			snapshotContent,
		}
		// {
		// 	updateVersionChanges: tableName === "version_change" ? false : true,
		// }
	);

	const activeVersion = executeSync({
		lix,
		query: db
			.selectFrom("active_version")
			.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
			.select(["version_v2.id", "version_v2.change_set_id"]),
	})[0];

	// skip change control for the following mutation that update the versions leaf
	executeSync({
		lix,
		query: db
			.insertInto("key_value")
			.values({
				key: "lix_skip_own_change_control",
				value: "true",
				skip_change_control: true,
			})
			.onConflict((oc) => oc.doUpdateSet({ value: "true" })),
	});

	const changeSet = executeSync({
		lix,
		query: db.insertInto("change_set").defaultValues().returningAll(),
	})[0];

	executeSync({
		lix,
		query: db.insertInto("change_set_element").values({
			change_set_id: changeSet.id,
			change_id: insertedChange.id,
			entity_id: insertedChange.entity_id,
			file_id: insertedChange.file_id,
			schema_key: insertedChange.schema_key,
		}),
	});

	executeSync({
		lix,
		query: db.insertInto("change_set_edge").values({
			parent_id: activeVersion.change_set_id,
			child_id: changeSet.id,
		}),
	});

	executeSync({
		lix,
		query: db
			.updateTable("version_v2")
			.set({ change_set_id: changeSet.id })
			.where("id", "=", activeVersion.id),
	});

	// remove the skip change control flag
	executeSync({
		lix,
		query: db
			.deleteFrom("key_value")
			.where("key", "=", "lix_skip_own_change_control"),
	});
}
