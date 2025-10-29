import type { Generated } from "kysely";
import type { LixGenerated } from "../../schema-definition/definition.js";
/**
 * Base type for regular entity views (active version only) that include operational columns from the state table.
 * These views do NOT expose lixcol_version_id to prevent accidental version-specific operations.
 *
 * @example
 * ```typescript
 * // Define an entity view type for active version operations
 * export type AccountView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityView;
 * ```
 */
export type StateEntityView = {
	/**
	 * The unique identifier for this entity within its schema and file.
	 *
	 * This is the primary identifier used to reference this specific entity.
	 */
	lixcol_entity_id: Generated<string>;

	/**
	 * The schema key that defines the structure and type of this entity.
	 *
	 * This references the schema definition that validates and types this entity.
	 */
	lixcol_schema_key: Generated<string>;

	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: Generated<string>;

	/**
	 * The plugin key that manages this entity type.
	 *
	 * This identifies which plugin is responsible for handling this entity.
	 */
	lixcol_plugin_key: Generated<string>;

	/**
	 * Version identifier this entity was inherited from during branching.
	 *
	 * - `null` if the entity was created in the current version
	 * - Contains the source version_id if the entity was inherited from another version
	 *
	 * This is useful for tracking entity lineage across version branches.
	 */
	lixcol_inherited_from_version_id: Generated<string | null>;

	/**
	 * Timestamp when this entity was created in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - When an entity is first created, this is the actual creation time
	 * - When an entity is inherited from another version, this is the time it was inherited
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_created_at: Generated<string>;

	/**
	 * Timestamp when this entity was last updated in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - Updates only when the entity is modified within the current version
	 * - When first inherited, this equals lixcol_created_at
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_updated_at: Generated<string>;

	/**
	 * Change identifier for the last modification to this entity.
	 *
	 * This references the change.id that last modified this entity, enabling
	 * blame and diff functionality. Useful for tracking who made changes
	 * and when they were made.
	 */
	lixcol_change_id: Generated<string>;

	/**
	 * Whether this entity is stored as untracked state.
	 *
	 * - `false` (default): Entity follows normal change control and versioning
	 * - `true`: Entity bypasses change control for UI state, temporary data, etc.
	 *
	 * Untracked entities don't create change records and have highest priority
	 * in the state resolution order: untracked > tracked > inherited.
	 */
	lixcol_untracked: Generated<boolean>;

	/**
	 * Commit identifier that contains this entity's last change.
	 *
	 * This references the commit.id that contains the last change to this entity.
	 * Useful for understanding which commit a particular entity state belongs to,
	 * enabling history queries and version comparison.
	 */
	lixcol_commit_id: Generated<string>;

	/**
	 * Writer key associated with the last mutation that produced this entity state.
	 *
	 * Used to attribute writes to individual clients/sessions for echo suppression.
	 * Null when no writer key was set for the mutation.
	 */
	lixcol_writer_key: Generated<string | null>;
};

/**
 * Base type for regular entity views (active version only) that include operational columns from the state table.
 * These views do NOT expose lixcol_version_id to prevent accidental version-specific operations.
 *
 * This type uses LixGenerated markers instead of Kysely's Generated type, making it compatible
 * with the Lix SDK's type transformation system.
 *
 * @example
 * ```typescript
 * // Define an entity view type for active version operations
 * export type AccountView = {
 *   id: LixGenerated<string>;
 *   name: string;
 * } & EntityStateColumns;
 * ```
 */
export type EntityStateColumns = {
	/**
	 * The unique identifier for this entity within its schema and file.
	 *
	 * This is the primary identifier used to reference this specific entity.
	 */
	lixcol_entity_id: LixGenerated<string>;

	/**
	 * The schema key that defines the structure and type of this entity.
	 *
	 * This references the schema definition that validates and types this entity.
	 */
	lixcol_schema_key: LixGenerated<string>;

	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: LixGenerated<string>;

	/**
	 * The plugin key that manages this entity type.
	 *
	 * This identifies which plugin is responsible for handling this entity.
	 */
	lixcol_plugin_key: LixGenerated<string>;

	/**
	 * Version identifier this entity was inherited from during branching.
	 *
	 * - `null` if the entity was created in the current version
	 * - Contains the source version_id if the entity was inherited from another version
	 *
	 * This is useful for tracking entity lineage across version branches.
	 */
	lixcol_inherited_from_version_id: LixGenerated<string | null>;

	/**
	 * Timestamp when this entity was created in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - When an entity is first created, this is the actual creation time
	 * - When an entity is inherited from another version, this is the time it was inherited
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_created_at: LixGenerated<string>;

	/**
	 * Timestamp when this entity was last updated in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - Updates only when the entity is modified within the current version
	 * - When first inherited, this equals lixcol_created_at
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_updated_at: LixGenerated<string>;

	/**
	 * Change identifier for the last modification to this entity.
	 *
	 * This references the change.id that last modified this entity, enabling
	 * blame and diff functionality. Useful for tracking who made changes
	 * and when they were made.
	 */
	lixcol_change_id: LixGenerated<string>;

	/**
	 * Whether this entity is stored as untracked state.
	 *
	 * - `false` (default): Entity follows normal change control and versioning
	 * - `true`: Entity bypasses change control for UI state, temporary data, etc.
	 *
	 * Untracked entities don't create change records and have highest priority
	 * in the state resolution order: untracked > tracked > inherited.
	 */
	lixcol_untracked: LixGenerated<boolean>;

	/**
	 * Commit identifier that contains this entity's last change.
	 *
	 * This references the commit.id that contains the last change to this entity.
	 * Useful for understanding which commit a particular entity state belongs to,
	 * enabling history queries and version comparison.
	 */
	lixcol_commit_id: LixGenerated<string>;

	/**
	 * Writer key associated with the last mutation that produced this entity state.
	 *
	 * Used to attribute writes to individual clients/sessions for echo suppression.
	 * Null when no writer key was set for the mutation.
	 */
	lixcol_writer_key: LixGenerated<string | null>;

	/**
	 * Arbitrary metadata attached to the change that produced this entity state.
	 *
	 * This is sourced from the metadata stored alongside the originating change
	 * and allows callers to attach additional contextual information without
	 * modifying the entity schema.
	 */
	lixcol_metadata: LixGenerated<Record<string, any> | null>;
};
