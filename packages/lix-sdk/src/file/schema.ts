import { handleFileInsert, handleFileUpdate } from "./file-handlers.js";
import { materializeFileData } from "./materialize-file-data.js";
import { materializeFileDataAtChangeset } from "./materialize-file-data-at-changeset.js";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { Lix } from "../lix/open-lix.js";

export function applyFileDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "plugin" | "hooks">
): void {
	lix.sqlite.createFunction({
		name: "handle_file_insert",
		arity: 7,
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
					hidden: Boolean(args[4]),
				},
				versionId: args[5],
				untracked: Boolean(args[6]),
			});
			return result;
		},
		deterministic: true,
	});

	lix.sqlite.createFunction({
		name: "handle_file_update",
		arity: 7,
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
					hidden: Boolean(args[4]),
				},
				versionId: args[5],
				untracked: Boolean(args[6]),
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
				rootChangeSetId: args[2],
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
                        (SELECT version_id FROM active_version),
                        json_extract(snapshot_content, '$.metadata')
                ) AS data,
                json_extract(snapshot_content, '$.metadata') AS metadata,
                json_extract(snapshot_content, '$.hidden') AS hidden,
                inherited_from_version_id AS lixcol_inherited_from_version_id,
                created_at AS lixcol_created_at,
                updated_at AS lixcol_updated_at,
                change_id AS lixcol_change_id,
                untracked AS lixcol_untracked
        FROM state
        WHERE schema_key = 'lix_file_descriptor';

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
                json_extract(snapshot_content, '$.hidden') AS hidden,
                version_id AS lixcol_version_id,
                inherited_from_version_id AS lixcol_inherited_from_version_id,
                created_at AS lixcol_created_at,
                updated_at AS lixcol_updated_at,
                change_id AS lixcol_change_id,
                untracked AS lixcol_untracked
        FROM state_all
        WHERE schema_key = 'lix_file_descriptor';


  CREATE TRIGGER IF NOT EXISTS file_insert
  INSTEAD OF INSERT ON file
  BEGIN
      SELECT handle_file_insert(
        COALESCE(NEW.id, nano_id()),
        NEW.path,
        NEW.data,
        NEW.metadata,
        COALESCE(NEW.hidden, 0),
        (SELECT version_id FROM active_version),
        COALESCE(NEW.lixcol_untracked, 0)
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
        COALESCE(NEW.hidden, OLD.hidden),
        (SELECT version_id FROM active_version),
        COALESCE(NEW.lixcol_untracked, 0)
      );
  END;

  CREATE TRIGGER IF NOT EXISTS file_delete
  INSTEAD OF DELETE ON file
  BEGIN
      -- Delete all non-lix_file entities associated with this file first
      DELETE FROM state_all
      WHERE file_id = OLD.id
        AND version_id = (SELECT version_id FROM active_version)
        AND schema_key != 'lix_file_descriptor';
        
      -- Delete the file entity itself
      DELETE FROM state_all
      WHERE entity_id = OLD.id
        AND schema_key = 'lix_file_descriptor'
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
        COALESCE(NEW.hidden, 0),
        COALESCE(NEW.lixcol_version_id, (SELECT version_id FROM active_version)),
        COALESCE(NEW.lixcol_untracked, 0)
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
        COALESCE(NEW.hidden, OLD.hidden),
        COALESCE(NEW.lixcol_version_id, OLD.lixcol_version_id),
        COALESCE(NEW.lixcol_untracked, 0)
      );
  END;

  CREATE TRIGGER IF NOT EXISTS file_all_delete
  INSTEAD OF DELETE ON file_all
  BEGIN
      -- Delete all non-lix_file entities associated with this file first
      DELETE FROM state_all
      WHERE file_id = OLD.id
        AND version_id = OLD.lixcol_version_id
        AND schema_key != 'lix_file_descriptor';
        
      -- Delete the file entity itself
      DELETE FROM state_all
      WHERE entity_id = OLD.id
        AND schema_key = 'lix_file_descriptor'
        AND version_id = OLD.lixcol_version_id;
  END;

  CREATE VIEW IF NOT EXISTS file_history AS
  SELECT
    json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.path') AS path,
    materialize_file_data_at_changeset(
      json_extract(snapshot_content, '$.id'),
      json_extract(snapshot_content, '$.path'),
      root_change_set_id,
      depth,
      json_extract(snapshot_content, '$.metadata')
    ) AS data,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    json_extract(snapshot_content, '$.hidden') AS hidden,
    file_id AS lixcol_file_id,
    plugin_key AS lixcol_plugin_key,
    schema_version AS lixcol_schema_version,
    change_id AS lixcol_change_id,
    change_set_id AS lixcol_change_set_id,
    root_change_set_id AS lixcol_root_change_set_id,
    depth AS lixcol_depth
  FROM state_history
  WHERE schema_key = 'lix_file_descriptor';
`);
}

export const LixFileDescriptorSchema = {
	"x-lix-key": "lix_file_descriptor",
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
		hidden: { type: "boolean", "x-lix-generated": true },
	},
	required: ["id", "path"],
	additionalProperties: false,
} as const;
LixFileDescriptorSchema satisfies LixSchemaDefinition;

/**
 * The file descriptor type representing the stored metadata for a file.
 *
 * This contains the file's identity and metadata but not the actual file content.
 * The file content (data) is materialized separately by aggregating entities from plugins.
 */
export type LixFileDescriptor = FromLixSchemaDefinition<
	typeof LixFileDescriptorSchema
>;

/**
 * Complete file type combining the descriptor with materialized data.
 *
 * Uses "Lix" prefix to avoid collision with JavaScript's built-in File type.
 * This represents the full file as seen in views, combining:
 * - LixFileDescriptor: stored metadata (id, path, metadata)
 * - data: materialized file content from plugin entities
 */
export type LixFile = LixFileDescriptor & {
	data: Uint8Array;
};
