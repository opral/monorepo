import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import {
	handleFileInsert,
	handleFileUpdate,
} from "./file-handlers.js";
import { materializeFileData } from "./materialize-file-data.js";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";
import type { Lix } from "../lix/open-lix.js";

export function applyFileDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "plugin">
): void {
	lix.sqlite.createFunction({
		name: "handle_file_insert",
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

			const result = handleFileInsert({
				lix,
				file: {
					id: args[0],
					path: args[1],
					data: args[2],
					metadata: metadata,
				},
				versionId: args[4],
			});
			return result;
		},
		deterministic: true,
	});

	lix.sqlite.createFunction({
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
				lix,
				file: {
					id: args[0],
					path: args[1],
					data: args[2],
					metadata: metadata,
				},
				versionId: args[4],
			});
			return result;
		},
		deterministic: true,
	});

	lix.sqlite.createFunction({
		name: "materialize_file_data",
		arity: 4,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return materializeFileData({
				lix,
				file: {
					id: args[0],
					path: args[1],
					metadata: args[3],
				},
				versionId: args[2],
			});
		},
	});

	lix.sqlite.exec(`
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
		inherited_from_version_id AS lixcol_inherited_from_version_id,
		created_at AS lixcol_created_at,
		updated_at AS lixcol_updated_at
	FROM state_active
	WHERE schema_key = 'lix_file';

  CREATE VIEW IF NOT EXISTS file_all AS
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
		version_id AS lixcol_version_id,
		inherited_from_version_id AS lixcol_inherited_from_version_id,
		created_at AS lixcol_created_at,
		updated_at AS lixcol_updated_at
	FROM state
	WHERE schema_key = 'lix_file';


  CREATE TRIGGER IF NOT EXISTS file_insert
  INSTEAD OF INSERT ON file
  BEGIN
      SELECT handle_file_insert(
        COALESCE(NEW.id, nano_id()),
        NEW.path,
        NEW.data,
        NEW.metadata,
        (SELECT version_id FROM active_version)
      );
  END;

  CREATE TRIGGER IF NOT EXISTS file_update
  INSTEAD OF UPDATE ON file
  BEGIN
      SELECT handle_file_update(
        NEW.id,
        NEW.path,
        NEW.data,
        NEW.metadata,
        (SELECT version_id FROM active_version)
      );
  END;

  CREATE TRIGGER IF NOT EXISTS file_delete
  INSTEAD OF DELETE ON file
  BEGIN
      -- Delete all non-lix_file entities associated with this file first
      DELETE FROM state
      WHERE file_id = OLD.id
        AND version_id = (SELECT version_id FROM active_version)
        AND schema_key != 'lix_file';
        
      -- Delete the file entity itself
      DELETE FROM state
      WHERE entity_id = OLD.id
        AND schema_key = 'lix_file'
        AND version_id = (SELECT version_id FROM active_version);
  END;

  CREATE TRIGGER IF NOT EXISTS file_all_insert
  INSTEAD OF INSERT ON file_all
  BEGIN
      SELECT handle_file_insert(
        COALESCE(NEW.id, nano_id()),
        NEW.path,
        NEW.data,
        NEW.metadata,
        COALESCE(NEW.lixcol_version_id, (SELECT version_id FROM active_version))
      );
  END;

  CREATE TRIGGER IF NOT EXISTS file_all_update
  INSTEAD OF UPDATE ON file_all
  BEGIN
      SELECT handle_file_update(
        NEW.id,
        NEW.path,
        NEW.data,
        NEW.metadata,
        COALESCE(NEW.lixcol_version_id, OLD.lixcol_version_id)
      );
  END;

  CREATE TRIGGER IF NOT EXISTS file_all_delete
  INSTEAD OF DELETE ON file_all
  BEGIN
      -- Delete all non-lix_file entities associated with this file first
      DELETE FROM state
      WHERE file_id = OLD.id
        AND version_id = OLD.lixcol_version_id
        AND schema_key != 'lix_file';
        
      -- Delete the file entity itself
      DELETE FROM state
      WHERE entity_id = OLD.id
        AND schema_key = 'lix_file'
        AND version_id = OLD.lixcol_version_id;
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

/**
 * Pure business logic type inferred from the LixFileSchema.
 *
 * Uses "Type" suffix to avoid collision with JavaScript's built-in File type,
 * while maintaining consistency with our naming pattern where schema-derived
 * types represent the pure business logic without database infrastructure columns.
 */
export type LixFileType = FromLixSchemaDefinition<typeof LixFileSchema>;

// Database view type (includes operational columns) - active version only
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
	lixcol_inherited_from_version_id: Generated<string | null>;
	lixcol_created_at: Generated<string>;
	lixcol_updated_at: Generated<string>;
};

// Database view type for cross-version operations
export type LixFileAllView = {
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
	lixcol_version_id: Generated<string>;
	lixcol_inherited_from_version_id: Generated<string | null>;
	lixcol_created_at: Generated<string>;
	lixcol_updated_at: Generated<string>;
};

/**
 * Kysely operation types for the file view.
 * 
 * These use the "Lix" prefix to avoid collision with JavaScript's built-in File type
 * and to clearly distinguish them as Lix-specific database view operations rather
 * than pure business logic types.
 */
export type LixFile = Selectable<LixFileView>;
export type NewLixFile = Insertable<LixFileView>;
export type LixFileUpdate = Updateable<LixFileView>;
