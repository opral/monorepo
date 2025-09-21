import { handleFileInsert, handleFileUpdate } from "./file-handlers.js";
import { materializeFileDataAtCommit } from "./materialize-file-data-at-commit.js";
import type { LixEngine } from "../../engine/boot.js";
import { materializeFileData } from "./materialize-file-data.js";
import { selectFileData } from "./select-file-data.js";
import { selectFileLixcol } from "./select-file-lixcol.js";
import {
	composeFilePathFromDescriptor,
	composeFilePathAtCommit,
} from "./descriptor-utils.js";
import {
	LixFileDescriptorSchema,
	type LixFileDescriptor,
} from "./schema-definition.js";

export function applyFileDatabaseSchema(args: { engine: LixEngine }): void {
	const engine = args.engine;
	// applied in databse itself before state because commit
	// logic writes into the licol cache
	// applyFileLixcolCacheSchema({ lix });

	engine.sqlite.createFunction({
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
				engine: engine,
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
		deterministic: false,
	});

	engine.sqlite.createFunction({
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
				engine: engine,
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
		deterministic: false,
	});

	engine.sqlite.createFunction({
		name: "materialize_file_data",
		arity: 8,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return materializeFileData({
				engine: engine,
				file: {
					id: args[0],
					path: args[1],
					metadata: args[3],
					directory_id: args[4],
					name: args[5],
					extension: args[6],
					hidden: args[7],
				},
				versionId: args[2],
			});
		},
	});

	engine.sqlite.createFunction({
		name: "select_file_data",
		arity: 8,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return selectFileData({
				engine: engine,
				file: {
					id: args[0],
					path: args[1],
					metadata: args[3],
					directory_id: args[4],
					name: args[5],
					extension: args[6],
					hidden: args[7],
				},
				versionId: args[2],
			});
		},
	});

	// Register SQL functions for lixcol metadata caching
	// Returns JSON string with {latest_change_id, latest_commit_id, created_at, updated_at}
	engine.sqlite.createFunction({
		name: "select_file_lixcol",
		arity: 2, // file_id, version_id
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			const lixcol = selectFileLixcol({
				engine: engine,
				fileId: args[0],
				versionId: args[1],
			});
			// Return as JSON string so SQL can extract fields
			return JSON.stringify(lixcol);
		},
	});

	engine.sqlite.createFunction({
		name: "materialize_file_data_at_commit",
		arity: 9,
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return materializeFileDataAtCommit({
				engine: engine,
				file: {
					id: args[0],
					path: args[1],
					metadata: args[4],
					directory_id: args[5],
					name: args[6],
					extension: args[7],
					hidden: args[8],
				},
				rootCommitId: args[2],
				depth: args[3],
			});
		},
	});

	engine.sqlite.createFunction({
		name: "compose_file_path",
		arity: 2,
		deterministic: false,
		xFunc: (_ctx: number, ...fnArgs: any[]) => {
			const fileId = fnArgs[0] as string;
			const versionId = String(fnArgs[1]);
			return (
				composeFilePathFromDescriptor({
					engine,
					versionId,
					fileId,
				}) ?? null
			);
		},
	});

	engine.sqlite.createFunction({
		name: "compose_file_path_at_commit",
		arity: 5,
		deterministic: false,
		xFunc: (_ctx: number, ...fnArgs: any[]) => {
			const [dirId, name, extension, rootCommitId, depth] = fnArgs;
			return (
				composeFilePathAtCommit({
					engine,
					directoryId: dirId ?? null,
					name: String(name ?? ""),
					extension:
						extension === null || extension === undefined
							? null
							: String(extension),
					rootCommitId: String(rootCommitId),
					depth: Number(depth ?? 0),
				}) ?? null
			);
		},
	});

	engine.sqlite.exec(`
	  CREATE VIEW IF NOT EXISTS file AS
	        SELECT 
	                id,
	                directory_id,
	                name,
                extension,
                path,
                data,
                metadata,
                hidden,
                lixcol_entity_id,
                lixcol_schema_key,
                lixcol_file_id,
                lixcol_inherited_from_version_id,
                lixcol_change_id,
                lixcol_created_at,
                lixcol_updated_at,
                lixcol_commit_id,
                lixcol_writer_key,
                lixcol_untracked,
                lixcol_metadata
        FROM file_all
        WHERE lixcol_version_id IN (SELECT version_id FROM active_version);

	  CREATE VIEW IF NOT EXISTS file_all AS
	        WITH file_lixcol AS (
	            SELECT
	                fd.entity_id,
	                fd.snapshot_content,
	                fd.version_id,
	                fd.inherited_from_version_id,
	                fd.untracked,
	                fd.metadata AS change_metadata,
	                select_file_lixcol(fd.entity_id, fd.version_id) AS lixcol_json
	            FROM state_all fd
	            WHERE fd.schema_key = 'lix_file_descriptor'
	        ),
	        directory_paths AS (
	            SELECT
	                id AS directory_id,
	                lixcol_version_id AS version_id,
	                path AS dir_path
	            FROM directory_all
	        ),
	        file_rows AS (
	            SELECT
	                json_extract(fl.snapshot_content, '$.id') AS id,
	                json_extract(fl.snapshot_content, '$.directory_id') AS directory_id,
	                json_extract(fl.snapshot_content, '$.name') AS name,
	                json_extract(fl.snapshot_content, '$.extension') AS extension,
	                json_extract(fl.snapshot_content, '$.metadata') AS metadata,
	                json_extract(fl.snapshot_content, '$.hidden') AS hidden,
	                fl.entity_id,
	                fl.version_id,
	                fl.inherited_from_version_id,
	                fl.untracked,
	                fl.change_metadata,
	                fl.lixcol_json,
	                dp.dir_path,
	                CASE
	                    WHEN json_extract(fl.snapshot_content, '$.directory_id') IS NULL THEN
	                        CASE
	                            WHEN json_extract(fl.snapshot_content, '$.extension') IS NULL OR json_extract(fl.snapshot_content, '$.extension') = ''
	                                THEN '/' || json_extract(fl.snapshot_content, '$.name')
	                            ELSE '/' || json_extract(fl.snapshot_content, '$.name') || '.' || json_extract(fl.snapshot_content, '$.extension')
	                        END
	                    ELSE
	                        CASE
	                            WHEN json_extract(fl.snapshot_content, '$.extension') IS NULL OR json_extract(fl.snapshot_content, '$.extension') = ''
	                                THEN COALESCE(dp.dir_path, '/') || json_extract(fl.snapshot_content, '$.name')
	                            ELSE COALESCE(dp.dir_path, '/') || json_extract(fl.snapshot_content, '$.name') || '.' || json_extract(fl.snapshot_content, '$.extension')
	                        END
	                END AS composed_path
	            FROM file_lixcol fl
	            LEFT JOIN directory_paths dp
	                ON dp.directory_id = json_extract(fl.snapshot_content, '$.directory_id')
	               AND dp.version_id = fl.version_id
	        )
	        SELECT
	                id,
	                directory_id,
	                name,
	                extension,
	                composed_path AS path,
	                select_file_data(
	                        id,
	                        composed_path,
	                        version_id,
	                        metadata,
	                        directory_id,
	                        name,
	                        extension,
	                        hidden
	                ) AS data,
	                metadata,
	                hidden,
	                entity_id AS lixcol_entity_id,
	                'lix_file_descriptor' AS lixcol_schema_key,
	                entity_id AS lixcol_file_id,
	                version_id AS lixcol_version_id,
	                inherited_from_version_id AS lixcol_inherited_from_version_id,
	                json_extract(lixcol_json, '$.latest_change_id') AS lixcol_change_id,
	                json_extract(lixcol_json, '$.created_at') AS lixcol_created_at,
	                json_extract(lixcol_json, '$.updated_at') AS lixcol_updated_at,
	                json_extract(lixcol_json, '$.latest_commit_id') AS lixcol_commit_id,
	                json_extract(lixcol_json, '$.writer_key') AS lixcol_writer_key,
	                untracked AS lixcol_untracked,
	                change_metadata AS lixcol_metadata
	        FROM file_rows;


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
        
      -- Clear the file lixcol cache
      DELETE FROM internal_file_lixcol_cache
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
        
      -- Clear the file lixcol cache
      DELETE FROM internal_file_lixcol_cache
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
    json_extract(snapshot_content, '$.directory_id') AS directory_id,
    json_extract(snapshot_content, '$.name') AS name,
    json_extract(snapshot_content, '$.extension') AS extension,
    compose_file_path_at_commit(
      json_extract(snapshot_content, '$.directory_id'),
      json_extract(snapshot_content, '$.name'),
      json_extract(snapshot_content, '$.extension'),
      root_commit_id,
      depth
    ) AS path,
    materialize_file_data_at_commit(
      json_extract(snapshot_content, '$.id'),
      compose_file_path_at_commit(
        json_extract(snapshot_content, '$.directory_id'),
        json_extract(snapshot_content, '$.name'),
        json_extract(snapshot_content, '$.extension'),
        root_commit_id,
        depth
      ),
      root_commit_id,
      depth,
      json_extract(snapshot_content, '$.metadata'),
      json_extract(snapshot_content, '$.directory_id'),
      json_extract(snapshot_content, '$.name'),
      json_extract(snapshot_content, '$.extension'),
      json_extract(snapshot_content, '$.hidden')
    ) AS data,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    json_extract(snapshot_content, '$.hidden') AS hidden,
    entity_id AS lixcol_entity_id,
    'lix_file_descriptor' AS lixcol_schema_key,
    'global' AS lixcol_version_id,
    file_id AS lixcol_file_id,
    plugin_key AS lixcol_plugin_key,
    schema_version AS lixcol_schema_version,
    change_id AS lixcol_change_id,
    commit_id AS lixcol_commit_id,
    root_commit_id AS lixcol_root_commit_id,
    depth AS lixcol_depth,
    metadata AS lixcol_metadata
  FROM state_history
  WHERE schema_key = 'lix_file_descriptor';
`);

	// internal_state_vtable is a virtual table; SQLite cannot attach indexes directly to it.
	// History queries can be optimized later with dedicated cache tables if necessary.
}

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
	path: string;
	data: Uint8Array;
};
