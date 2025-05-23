import type {
	Generated,
	Insertable,
	Kysely,
	Selectable,
	Updateable,
} from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import {
	handleFileInsert,
	handleFileUpdate,
	materializeFileData,
} from "./file-handlers.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

export function applyFileDatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>
): void {
	sqlite.createFunction({
		name: "handle_file_insert",
		arity: 5,
		xFunc: (_ctx: number, ...args: any[]) => {
			// Parse metadata if it's a JSON string (SQLite converts objects to strings)
			let metadata = args[3];
			if (typeof metadata === 'string' && metadata !== null) {
				try {
					metadata = JSON.parse(metadata);
				} catch {
					// If parsing fails, keep as string
				}
			}

			const result = handleFileInsert({
				sqlite,
				db,
				file: {
					id: args[0],
					path: args[1],
					data: args[2],
					metadata: metadata,
					version_id: args[4],
				},
			});
			return result;
		},
		deterministic: true,
	});

	sqlite.createFunction({
		name: "handle_file_update",
		arity: 5,
		xFunc: (_ctx: number, ...args: any[]) => {
			// Parse metadata if it's a JSON string (SQLite converts objects to strings)
			let metadata = args[3];
			if (typeof metadata === "string" && metadata !== null) {
				try {
					metadata = JSON.parse(metadata);
				} catch {
					// If parsing fails, keep as string
				}
			}

			const result = handleFileUpdate({
				sqlite,
				db,
				file: {
					id: args[0],
					path: args[1],
					data: args[2],
					metadata: metadata,
					version_id: args[4],
				},
			});
			return result;
		},
		deterministic: true,
	});

	sqlite.createFunction({
		name: "materialize_file_data",
		arity: 4,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return materializeFileData({
				sqlite,
				db,
				file: {
					id: args[0],
					path: args[1],
					version_id: args[2],
					metadata: args[3],
				},
			});
		},
	});

	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS file AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
		json_extract(snapshot_content, '$.path') AS path,
		materialize_file_data(
			json_extract(snapshot_content, '$.id'), 
			json_extract(snapshot_content, '$.path'), 
			version_id,
			json_extract(snapshot_content, '$.metadata')
		) AS data,
		json_extract(snapshot_content, '$.metadata') AS metadata,
		version_id
	FROM state
	WHERE schema_key = 'lix_file';


  CREATE TRIGGER file_insert
  INSTEAD OF INSERT ON file
  BEGIN
      SELECT handle_file_insert(
        COALESCE(NEW.id, nano_id()),
        NEW.path,
        NEW.data,
        NEW.metadata,
        COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
      );
  END;

  CREATE TRIGGER file_update
  INSTEAD OF UPDATE ON file
  BEGIN
      SELECT handle_file_update(
        NEW.id,
        NEW.path,
        NEW.data,
        NEW.metadata,
        COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
      );
  END;

  CREATE TRIGGER file_delete
  INSTEAD OF DELETE ON file
  BEGIN
      DELETE FROM state
      WHERE entity_id = OLD.id
        AND schema_key = 'lix_file'
        AND version_id = OLD.version_id;
  END;
`);
}

export const LixFileSchema = {
	"x-lix-key": "lix_file",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["path"]],
	type: "object",
	properties: {
		id: { type: "string" },
		path: {
			type: "string",
			pattern: "^/(?!.*//|.*\\\\)(?!.*/$|^/$).+",
			description:
				"File path must start with a slash, not contain backslashes or consecutive slashes, and not end with a slash",
		},
		metadata: {
			type: "object",
			nullable: true,
		},
	},
	required: ["id", "path"],
} as const;
LixFileSchema satisfies LixSchemaDefinition;

// named lix file to avoid conflict with built-in file type
export type LixFile = Selectable<LixFileView>;
export type NewLixFile = Insertable<LixFileView>;
export type LixFileUpdate = Updateable<LixFileView>;
export type LixFileView = {
	id: Generated<string>;
	/**
	 * The path of the file.
	 *
	 * The path is currently defined as a subset of RFC 3986.
	 * Any path can be tested with the `isValidFilePath()` function.
	 *
	 * @example
	 *   - `/path/to/file.txt`
	 */
	path: string;
	data: Uint8Array;
	metadata: Record<string, any> | null;
	version_id: Generated<string>;
};
