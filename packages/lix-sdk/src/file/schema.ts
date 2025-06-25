import { handleFileInsert, handleFileUpdate } from "./file-handlers.js";
import { materializeFileData } from "./materialize-file-data.js";
import { materializeFileDataAtChangeset } from "./materialize-file-data-at-changeset.js";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
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

	lix.sqlite.createFunction({
		name: "materialize_file_data_at_changeset",
		arity: 5,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return materializeFileDataAtChangeset({
				lix,
				file: {
					id: args[0],
					path: args[1],
					metadata: args[4],
				},
				changeSetId: args[2],
				depth: args[3],
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
		updated_at AS lixcol_updated_at,
		change_id AS lixcol_change_id
	FROM state
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
		updated_at AS lixcol_updated_at,
		change_id AS lixcol_change_id
	FROM state_all
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
      DELETE FROM state_all
      WHERE file_id = OLD.id
        AND version_id = (SELECT version_id FROM active_version)
        AND schema_key != 'lix_file';
        
      -- Delete the file entity itself
      DELETE FROM state_all
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
      DELETE FROM state_all
      WHERE file_id = OLD.id
        AND version_id = OLD.lixcol_version_id
        AND schema_key != 'lix_file';
        
      -- Delete the file entity itself
      DELETE FROM state_all
      WHERE entity_id = OLD.id
        AND schema_key = 'lix_file'
        AND version_id = OLD.lixcol_version_id;
  END;

  CREATE VIEW IF NOT EXISTS file_history AS
  SELECT
    json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.path') AS path,
    materialize_file_data_at_changeset(
      json_extract(snapshot_content, '$.id'),
      json_extract(snapshot_content, '$.path'),
      change_set_id,
      depth,
      json_extract(snapshot_content, '$.metadata')
    ) AS data,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    file_id AS lixcol_file_id,
    plugin_key AS lixcol_plugin_key,
    schema_version AS lixcol_schema_version,
    change_id AS lixcol_change_id,
    change_set_id AS lixcol_change_set_id,
    depth AS lixcol_depth
  FROM state_history
  WHERE schema_key = 'lix_file';
`);
}

export const LixFileSchema = {
	"x-lix-key": "lix_file",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["path"]],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
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
	additionalProperties: false,
} as const;
LixFileSchema satisfies LixSchemaDefinition;

/**
 * Pure business logic type inferred from the LixFileSchema.
 *
 * Uses "Type" suffix to avoid collision with JavaScript's built-in File type,
 * while maintaining consistency with our naming pattern where schema-derived
 * types represent the pure business logic without database infrastructure columns.
 */
export type LixFile = FromLixSchemaDefinition<typeof LixFileSchema> & {
	data: Uint8Array;
};
