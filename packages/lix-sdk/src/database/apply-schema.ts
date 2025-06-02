import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import { LixSchemaViewMap, type LixInternalDatabaseSchema } from "./schema.js";
// import { applyOwnChangeControlTriggers } from "../own-change-control/database-triggers.js";
import { applyLogDatabaseSchema } from "../log/schema.js";
// import { applyKeyValueViewDatabaseSchema } from "../key-value/database-schema.js";
import { applyChangeDatabaseSchema } from "../change/schema.js";
import { applyChangeSetDatabaseSchema } from "../change-set-v2/schema.js";
import { applyVersionDatabaseSchema } from "../version/schema.js";
import { applySnapshotDatabaseSchema } from "../snapshot/schema.js";
import { applyStoredSchemaDatabaseSchema } from "../stored-schema/schema.js";
import { applyKeyValueDatabaseSchema } from "../key-value/schema.js";
import { applyStateDatabaseSchema } from "../state/schema.js";
import { applyChangeAuthorDatabaseSchema } from "../change-author/schema.js";
import { applyLabelDatabaseSchema } from "../label/schema.js";
import { applyThreadDatabaseSchema } from "../thread/schema.js";

/**
 * Applies the database schema to the given sqlite database.
 */
export function applySchema(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}): SqliteWasmDatabase {
	applySnapshotDatabaseSchema(args.sqlite);
	applyChangeDatabaseSchema(args.sqlite);
	applyChangeSetDatabaseSchema(args.sqlite);
	applyStateDatabaseSchema(args.sqlite, args.db);
	applyStoredSchemaDatabaseSchema(args.sqlite);
	applyVersionDatabaseSchema(args.sqlite);
	applyKeyValueDatabaseSchema(args.sqlite);
	applyChangeAuthorDatabaseSchema(args.sqlite);
	applyLabelDatabaseSchema(args.sqlite);
	applyThreadDatabaseSchema(args.sqlite);
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	applyLogDatabaseSchema(args.sqlite);

	// insert the schemas into the stored_schema table
	// to enable validation. must be done after the database
	// schemas have been applied to ensure that the stored_schema
	// table exists.
	// Check if any schemas need to be inserted, and if so, clear cache once before all insertions
	let needsCacheClear = false;
	for (const schema of Object.values(LixSchemaViewMap)) {
		const exists = args.sqlite.exec({
			sql: `SELECT 1 FROM stored_schema WHERE key = '${schema["x-lix-key"]}' AND version = '${schema["x-lix-version"]}'`,
			returnValue: "resultRows"
		});
		
		if (!exists || exists.length === 0) {
			needsCacheClear = true;
			break;
		}
	}
	
	if (needsCacheClear) {
		// Clear cache once to ensure clean initialization for all new schemas
		args.sqlite.exec("DELETE FROM internal_state_cache");
	}
	
	for (const schema of Object.values(LixSchemaViewMap)) {
		args.sqlite.exec(
			`
			INSERT INTO stored_schema (value)
			SELECT ?
			WHERE NOT EXISTS (
				SELECT 1
				FROM stored_schema
				WHERE key = '${schema["x-lix-key"]}'
				AND version = '${schema["x-lix-version"]}'
			);
			`,
			{ bind: [JSON.stringify(schema)] }
		);
	}
	return args.sqlite;
}
