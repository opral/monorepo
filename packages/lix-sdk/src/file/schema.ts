import { handleFileInsert, handleFileUpdate } from "./file-handlers.js";
import { materializeFileDataAtCommit } from "./materialize-file-data-at-commit.js";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { Lix } from "../lix/open-lix.js";
import { materializeFileData } from "./materialize-file-data.js";
import { selectFileData } from "./select-file-data.js";
import { applyFileDataCacheSchema } from "./cache/schema.js";

export function applyFileDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "plugin" | "hooks">
): void {
	// Apply the file data cache schema
	applyFileDataCacheSchema(lix);

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
		name: "select_file_data",
		arity: 4,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return selectFileData({
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
		name: "materialize_file_data_at_commit",
		arity: 5,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return materializeFileDataAtCommit({
				lix,
				file: {
					id: args[0],
					path: args[1],
					metadata: args[4],
				},
				rootCommitId: args[2],
				depth: args[3],
			});
		},
	});

	lix.sqlite.exec(`
  CREATE VIEW IF NOT EXISTS file AS
        WITH latest_file_change AS (
            SELECT 
                fd.entity_id as file_id,
                -- Get the latest change across all entities in this file
                (SELECT s.change_id 
                 FROM state s 
                 WHERE s.file_id = fd.entity_id
                 ORDER BY s.updated_at DESC 
                 LIMIT 1) as latest_change_id,
                -- Get the latest change_set that contains any change for this file
                (SELECT cse.change_set_id
                 FROM change_set_element cse
                 INNER JOIN state s ON s.change_id = cse.change_id
                 WHERE s.file_id = fd.entity_id
                 ORDER BY s.updated_at DESC
                 LIMIT 1
                ) as latest_change_set_id
            FROM state fd
            WHERE fd.schema_key = 'lix_file_descriptor'
        )
        SELECT
                json_extract(fd.snapshot_content, '$.id') AS id,
                json_extract(fd.snapshot_content, '$.path') AS path,
                select_file_data(
                        json_extract(fd.snapshot_content, '$.id'),
                        json_extract(fd.snapshot_content, '$.path'),
                        (SELECT version_id FROM active_version),
                        json_extract(fd.snapshot_content, '$.metadata')
                ) AS data,
                json_extract(fd.snapshot_content, '$.metadata') AS metadata,
                json_extract(fd.snapshot_content, '$.hidden') AS hidden,
                fd.entity_id AS lixcol_entity_id,
                'lix_file_descriptor' AS lixcol_schema_key,
                fd.entity_id AS lixcol_file_id,  -- For files, file_id equals entity_id
                fd.inherited_from_version_id AS lixcol_inherited_from_version_id,
                -- Use the latest change info from any entity in the file
                lc.latest_change_id AS lixcol_change_id,
                (SELECT created_at FROM change WHERE id = lc.latest_change_id) AS lixcol_created_at,
                (SELECT created_at FROM change WHERE id = lc.latest_change_id) AS lixcol_updated_at,
                lc.latest_change_set_id AS lixcol_commit_id,
                fd.untracked AS lixcol_untracked
        FROM state fd
        JOIN latest_file_change lc ON lc.file_id = fd.entity_id
        WHERE fd.schema_key = 'lix_file_descriptor';

  CREATE VIEW IF NOT EXISTS file_all AS
        WITH latest_file_change AS (
            SELECT 
                fd.entity_id as file_id,
                fd.version_id,
                -- Get the latest change across all entities in this file for this version
                (SELECT s.change_id 
                 FROM state_all s 
                 WHERE s.file_id = fd.entity_id
                   AND s.version_id = fd.version_id
                 ORDER BY s.updated_at DESC 
                 LIMIT 1) as latest_change_id,
                -- Get the latest change_set that contains any change for this file
                (SELECT cse.change_set_id
                 FROM change_set_element cse
                 INNER JOIN state_all s ON s.change_id = cse.change_id
                 WHERE s.file_id = fd.entity_id
                   AND s.version_id = fd.version_id
                 ORDER BY s.updated_at DESC
                 LIMIT 1
                ) as latest_change_set_id
            FROM state_all fd
            WHERE fd.schema_key = 'lix_file_descriptor'
        )
        SELECT
                json_extract(fd.snapshot_content, '$.id') AS id,
                json_extract(fd.snapshot_content, '$.path') AS path,
                select_file_data(
                        json_extract(fd.snapshot_content, '$.id'),
                        json_extract(fd.snapshot_content, '$.path'),
                        fd.version_id,
                        json_extract(fd.snapshot_content, '$.metadata')
                ) AS data,
                json_extract(fd.snapshot_content, '$.metadata') AS metadata,
                json_extract(fd.snapshot_content, '$.hidden') AS hidden,
                fd.entity_id AS lixcol_entity_id,
                'lix_file_descriptor' AS lixcol_schema_key,
                fd.entity_id AS lixcol_file_id,  -- For files, file_id equals entity_id
                fd.version_id AS lixcol_version_id,
                fd.inherited_from_version_id AS lixcol_inherited_from_version_id,
                -- Use the latest change info from any entity in the file
                lc.latest_change_id AS lixcol_change_id,
                (SELECT created_at FROM change WHERE id = lc.latest_change_id) AS lixcol_created_at,
                (SELECT created_at FROM change WHERE id = lc.latest_change_id) AS lixcol_updated_at,
                lc.latest_change_set_id AS lixcol_commit_id,
                fd.untracked AS lixcol_untracked
        FROM state_all fd
        JOIN latest_file_change lc ON lc.file_id = fd.entity_id AND lc.version_id = fd.version_id
        WHERE fd.schema_key = 'lix_file_descriptor';


  CREATE TRIGGER IF NOT EXISTS file_insert
  INSTEAD OF INSERT ON file
  BEGIN
      SELECT handle_file_insert(
        COALESCE(NEW.id, lix_nano_id()),
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
      -- Clear the file data cache
      DELETE FROM internal_file_data_cache
      WHERE file_id = OLD.id
        AND version_id = (SELECT version_id FROM active_version);
        
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
        COALESCE(NEW.id, lix_nano_id()),
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
      -- Clear the file data cache
      DELETE FROM internal_file_data_cache
      WHERE file_id = OLD.id
        AND version_id = OLD.lixcol_version_id;
        
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
    materialize_file_data_at_commit(
      json_extract(snapshot_content, '$.id'),
      json_extract(snapshot_content, '$.path'),
      root_commit_id,
      depth,
      json_extract(snapshot_content, '$.metadata')
    ) AS data,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    json_extract(snapshot_content, '$.hidden') AS hidden,
    entity_id AS lixcol_entity_id,
    'lix_file_descriptor' AS lixcol_schema_key,
    file_id AS lixcol_file_id,
    plugin_key AS lixcol_plugin_key,
    schema_version AS lixcol_schema_version,
    change_id AS lixcol_change_id,
    commit_id AS lixcol_commit_id,
    root_commit_id AS lixcol_root_commit_id,
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
 * This is the underlying entity stored in the database with schema_key 'lix_file_descriptor'.
 * It contains only the file's identity and metadata - NOT the actual file content.
 *
 * ```
 * ┌─────────────────────────────────────────┐
 * │         LixFileDescriptor               │
 * │    (schema_key: 'lix_file_descriptor')  │
 * ├─────────────────────────────────────────┤
 * │ • id: string (file identifier)          │
 * │ • path: string (e.g., "/docs/README.md")│
 * │ • metadata: object | null               │
 * │ • hidden: boolean                       │
 * └─────────────────────────────────────────┘
 *               ↓
 *     Stored in state/state_all table
 *               ↓
 * ┌─────────────────────────────────────────┐
 * │ File content entities are stored        │
 * │ separately with file_id = descriptor.id │
 * │                                         │
 * │ • JSON properties (mock_json_property)  │
 * │ • Markdown blocks (markdown_block)      │
 * │ • CSV rows (csv_row)                    │
 * │ • etc...                                │
 * └─────────────────────────────────────────┘
 * ```
 *
 * Key points:
 * - File descriptors are just metadata - they don't contain file data
 * - The actual file content is stored as separate entities linked by file_id
 * - File views aggregate the descriptor + content entities into a complete file
 * - Changes to file content don't update the descriptor (and vice versa)
 */
export type LixFileDescriptor = FromLixSchemaDefinition<
	typeof LixFileDescriptorSchema
>;

/**
 * Complete file type combining the descriptor with materialized data.
 *
 * Uses "Lix" prefix to avoid collision with JavaScript's built-in File type.
 *
 * IMPORTANT: File views are projections over multiple entities, not just the file descriptor.
 * However, they expose schema_key as 'lix_file_descriptor' to maintain foreign key integrity.
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                        File View                            │
 * │               (schema_key: 'lix_file_descriptor')           │
 * │                                                             │
 * │  ┌─────────────────────────┐   ┌─────────────────────────┐ │
 * │  │   File Descriptor       │   │   Plugin Entities       │ │
 * │  │ (lix_file_descriptor)   │   │                         │ │
 * │  ├─────────────────────────┤   ├─────────────────────────┤ │
 * │  │ • id                    │   │ • JSON properties       │ │
 * │  │ • path                  │ + │ • Markdown blocks       │ │
 * │  │ • metadata              │   │ • CSV rows              │ │
 * │  │ • hidden                │   │ • Future: thumbnails    │ │
 * │  └─────────────────────────┘   └─────────────────────────┘ │
 * │                    ↓                       ↓                │
 * │              ┌─────────────────────────────────┐           │
 * │              │    Materialized as LixFile      │           │
 * │              │  • All descriptor fields        │           │
 * │              │  • data: Uint8Array (from       │           │
 * │              │    plugin entities)             │           │
 * │              └─────────────────────────────────┘           │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * This projection approach means:
 * - File views aggregate changes from ALL entities within the file
 * - The 'data' field is dynamically materialized from plugin entities
 * - A single file view row represents multiple underlying entities
 */
export type LixFile = LixFileDescriptor & {
	data: Uint8Array;
};
