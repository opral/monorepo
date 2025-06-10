import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";

export function applyVersionInheritanceDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	sqlite.exec(`
		-- version_inheritance view
		CREATE VIEW IF NOT EXISTS version_inheritance AS
		SELECT
			json_extract(snapshot_content, '$.child_version_id') AS child_version_id,
			json_extract(snapshot_content, '$.parent_version_id') AS parent_version_id,
			version_id
		FROM state
		WHERE schema_key = 'lix_version_inheritance';

		CREATE TRIGGER IF NOT EXISTS version_inheritance_insert
		INSTEAD OF INSERT ON version_inheritance
		BEGIN
			-- Check for circular inheritance before inserting
			SELECT CASE
				WHEN EXISTS (
					WITH RECURSIVE inheritance_path(descendant_id, ancestor_id, level) AS (
						-- Base case: direct inheritance from the new child
						SELECT 
							json_extract(snapshot_content, '$.child_version_id') as descendant_id, 
							json_extract(snapshot_content, '$.parent_version_id') as ancestor_id, 
							1 as level
						FROM state 
						WHERE schema_key = 'lix_version_inheritance'
						AND json_extract(snapshot_content, '$.child_version_id') = NEW.parent_version_id
						
						UNION ALL
						
						-- Recursive case: follow inheritance chain
						SELECT 
							json_extract(s.snapshot_content, '$.child_version_id'), 
							ip.ancestor_id, 
							ip.level + 1
						FROM state s
						JOIN inheritance_path ip ON json_extract(s.snapshot_content, '$.parent_version_id') = ip.descendant_id
						WHERE s.schema_key = 'lix_version_inheritance'
						AND ip.level < 100  -- Prevent infinite recursion
					)
					SELECT 1 FROM inheritance_path 
					WHERE ancestor_id = NEW.child_version_id
				)
				THEN RAISE(ABORT, 'Circular inheritance detected')
			END;

			INSERT INTO state (
				entity_id,
				schema_key,
				file_id,
				plugin_key,
				snapshot_content,
				schema_version,
				version_id
			) VALUES (
				NEW.parent_version_id || '::' || NEW.child_version_id,
				'lix_version_inheritance',
				'lix',
				'lix_own_entity',
				json_object(
					'child_version_id', NEW.child_version_id,
					'parent_version_id', NEW.parent_version_id
				),
				'${LixVersionInheritanceSchema["x-lix-version"]}',
				'global'
			);
		END;

		CREATE TRIGGER IF NOT EXISTS version_inheritance_update
		INSTEAD OF UPDATE ON version_inheritance
		BEGIN
			UPDATE state
			SET
				snapshot_content = json_object(
					'child_version_id', NEW.child_version_id,
					'parent_version_id', NEW.parent_version_id
				),
				version_id = 'global'
			WHERE
				entity_id = OLD.parent_version_id || '::' || OLD.child_version_id
				AND schema_key = 'lix_version_inheritance'
				AND file_id = 'lix';
		END;

		CREATE TRIGGER IF NOT EXISTS version_inheritance_delete
		INSTEAD OF DELETE ON version_inheritance
		BEGIN
			DELETE FROM state
			WHERE entity_id = OLD.parent_version_id || '::' || OLD.child_version_id
			AND schema_key = 'lix_version_inheritance';
		END;

		-- Create global version if it doesn't exist
		-- Note: This will be created after version schema is applied
	`);
}

export const LixVersionInheritanceSchema = {
	"x-lix-key": "lix_version_inheritance",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["parent_version_id", "child_version_id"],
	"x-lix-foreign-keys": {
		child_version_id: {
			schemaKey: "lix_version",
			property: "id",
		},
		parent_version_id: {
			schemaKey: "lix_version",
			property: "id",
		},
	},
	type: "object",
	properties: {
		child_version_id: { type: "string" },
		parent_version_id: { type: "string" },
	},
	required: ["child_version_id", "parent_version_id"],
	additionalProperties: false,
} as const;
LixVersionInheritanceSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixVersionInheritance = FromLixSchemaDefinition<
	typeof LixVersionInheritanceSchema
>;

// Database view type (includes operational columns)
export type VersionInheritanceView = {
	child_version_id: string;
	parent_version_id: string;
	version_id: Generated<string>;
};

// Kysely operation types
export type VersionInheritance = Selectable<VersionInheritanceView>;
export type NewVersionInheritance = Insertable<VersionInheritanceView>;
export type VersionInheritanceUpdate = Updateable<VersionInheritanceView>;
