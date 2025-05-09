import { type Generated, type Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

export function applyKeyValueViewDatabaseSchema(
	sqlite: SqliteWasmDatabase,
): SqliteWasmDatabase {
	return sqlite.exec`
	CREATE VIEW key_value_v2 AS
	WITH RECURSIVE
	  -- Build the ancestry for every version (id, head change_set_id)
	  version_heads(version_id, head_cs) AS (
	    SELECT v.id, v.change_set_id
	    FROM   version v
	  ),
	  ancestors(version_id, cs_id) AS (
	    SELECT version_id, head_cs FROM version_heads
	    UNION ALL
	    SELECT a.version_id, ce.parent_id
	      FROM change_set_edge ce
	      JOIN ancestors a ON ce.child_id = a.cs_id
	  ),
	  latest_per_key AS (
	    SELECT
	      a.version_id AS version_id,
	      json_extract(s.content, '$.key') AS key,
	      json_extract(s.content, '$.value') AS value,
	      c.created_at AS created_at,
	      ROW_NUMBER() OVER (
	        PARTITION BY a.version_id, json_extract(s.content, '$.key')
	        ORDER BY c.rowid DESC
	      ) AS rn
	    FROM ancestors a
	    JOIN change_set_element cse ON cse.change_set_id = a.cs_id
	    JOIN change c ON c.id = cse.change_id
	    JOIN snapshot s ON s.id = c.snapshot_id
	    WHERE s.content IS NOT NULL
	      AND json_type(s.content, '$.key') IS NOT NULL
	  )

	SELECT key, value, version_id, created_at
	FROM   latest_per_key
	WHERE  rn = 1;

	CREATE TRIGGER key_value_v2_insert
	INSTEAD OF INSERT ON key_value_v2
	BEGIN
	    INSERT INTO snapshot (content)
	    VALUES (jsonb(json_object('key', NEW.key, 'value', NEW.value)));
	    INSERT INTO change (
	        entity_id,
	        schema_key,
	        file_id,
	        plugin_key,
	        snapshot_id,
	        created_at
	    )
	    VALUES (
	        NEW.key,
	        'lix_key_value_v2_table',
	        'lix_own_change_control',
	        'lix_own_change_control',
	        (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
	        CURRENT_TIMESTAMP
	    );
	    INSERT INTO change_set (id, immutable_elements)
	    VALUES ('lix_own_change_control', 0)
	    ON CONFLICT(id) DO NOTHING;
	    INSERT INTO change_set_element (
	        change_set_id,
	        change_id,
	        entity_id,
	        file_id,
	        schema_key
	    ) VALUES (
	        'lix_own_change_control',
	        (SELECT id FROM change ORDER BY rowid DESC LIMIT 1),
	        NEW.key,
	        'lix_own_change_control',
	        'lix_key_value_v2_table'
	    )
	    ON CONFLICT(change_set_id, entity_id, file_id, schema_key)
	    DO UPDATE SET change_id=excluded.change_id;
	END;

	CREATE TRIGGER key_value_v2_update
	INSTEAD OF UPDATE ON key_value_v2
	BEGIN
	    INSERT INTO snapshot (content)
	    VALUES (jsonb(json_object('key', NEW.key, 'value', NEW.value)));
	    INSERT INTO change (
	        entity_id,
	        schema_key,
	        file_id,
	        plugin_key,
	        snapshot_id,
	        created_at
	    )
	    VALUES (
	        NEW.key,
	        'lix_key_value_v2_table',
	        'lix_own_change_control',
	        'lix_own_change_control',
	        (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
	        CURRENT_TIMESTAMP
	    );
	    INSERT INTO change_set (id, immutable_elements)
	    VALUES ('lix_own_change_control', 0)
	    ON CONFLICT(id) DO NOTHING;
	    INSERT INTO change_set_element (
	        change_set_id,
	        change_id,
	        entity_id,
	        file_id,
	        schema_key
	    ) VALUES (
	        'lix_own_change_control',
	        (SELECT id FROM change ORDER BY rowid DESC LIMIT 1),
	        NEW.key,
	        'lix_own_change_control',
	        'lix_key_value_v2_table'
	    )
	    ON CONFLICT(change_set_id, entity_id, file_id, schema_key)
	    DO UPDATE SET change_id=excluded.change_id;
	END;

	CREATE TRIGGER key_value_v2_delete
	INSTEAD OF DELETE ON key_value_v2
	BEGIN
	    INSERT INTO snapshot (content)
	    VALUES (jsonb(NULL));
	    INSERT INTO change (
	        entity_id,
	        schema_key,
	        file_id,
	        plugin_key,
	        snapshot_id,
	        created_at
	    )
	    VALUES (
	        OLD.key,
	        'lix_key_value_v2_table',
	        'lix_own_change_control',
	        'lix_own_change_control',
	        (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
	        CURRENT_TIMESTAMP
	    );
	    INSERT INTO change_set (id, immutable_elements)
	    VALUES ('lix_own_change_control', 0)
	    ON CONFLICT(id) DO NOTHING;
	    INSERT INTO change_set_element (
	        change_set_id,
	        change_id,
	        entity_id,
	        file_id,
	        schema_key
	    ) VALUES (
	        'lix_own_change_control',
	        (SELECT id FROM change ORDER BY rowid DESC LIMIT 1),
	        OLD.key,
	        'lix_own_change_control',
	        'lix_key_value_v2_table'
	    )
	    ON CONFLICT(change_set_id, entity_id, file_id, schema_key)
	    DO UPDATE SET change_id=excluded.change_id;
	END;
`;
}

export type KeyValueV2 = Selectable<KeyValueV2Table>;

export type KeyValueV2Table = {
	key: string;
	value: any; // JSON
	version_id: string | null;
	created_at: Generated<string>; // ISO timestamp from change.created_at
};

type PredefinedKeys =
	| "lix_id"
	| "lix_server_url"
	| "lix_sync"
	| "lix_log_levels";
// The string & {} ensures TypeScript recognizes KeyValueKeys
// as a superset of string, preventing conflicts when using other string values.
type KeyType = string & {};
type KeyValueKeys = PredefinedKeys | KeyType;
