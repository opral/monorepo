import type { Lix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import {
	createEntityStateView,
	type StateEntityView,
	type ValidationRule,
	type ValidationCallbacks,
} from "./entity-state.js";
import {
	createEntityStateAllView,
	type StateEntityAllView,
} from "./entity-state-all.js";
import {
	createEntityStateHistoryView,
	type StateEntityHistoryView,
} from "./entity-state_history.js";

// Re-export types for backward compatibility
export type { StateEntityView, StateEntityAllView, StateEntityHistoryView };
export type { ValidationRule, ValidationCallbacks };

/**
 * Creates SQL views and CRUD triggers for an entity based on its schema definition.
 *
 * This function automatically generates three views:
 * - Primary view (e.g., "key_value") - uses state_active (active version only)
 * - All view (e.g., "key_value_all") - uses state (all versions)
 * - History view (e.g., "key_value_history") - uses state_history (historical states)
 *
 * Each view includes:
 * - A view that extracts JSON properties from the respective table
 * - CRUD triggers for entity and entity_all views (history view is read-only)
 *
 * @throws Error if schema type is not "object" or x-lix-primary-key is not defined
 *
 * @example
 * ```typescript
 * // Basic usage for key-value entities
 * createEntityViewsIfNotExists({
 *   lix,
 *   schema: LixKeyValueSchema,
 *   overrideName: "key_value",
 *   pluginKey: "lix_key_value",
 *   hardcodedFileId: "lix"
 * });
 * // Creates: key_value, key_value_all, and key_value_history
 *
 * // With default values for account entities
 * createEntityViewsIfNotExists({
 *   lix,
 *   schema: LixAccountSchema,
 *   overrideName: "account",
 *   pluginKey: "lix_own_entity",
 *   hardcodedFileId: "lix",
 *   defaultValues: {
 *     id: (row) => nanoid()
 *   }
 * });
 * // Creates: account, account_all, and account_history
 * ```
 */
export function createEntityViewsIfNotExists(args: {
	lix: Pick<Lix, "sqlite">;
	schema: LixSchemaDefinition;
	/** Overrides the view name which defaults to schema["x-lix-key"] */
	overrideName?: string;
	/** Plugin identifier for the entity */
	pluginKey: string;
	/** Optional hardcoded file_id (if not provided, uses lixcol_file_id from mutations) */
	hardcodedFileId?: string;
	/** Optional hardcoded version_id (if not provided, uses lixcol_version_id from mutations or active version) */
	hardcodedVersionId?: string;
	/** Object mapping property names to functions that generate default values */
	defaultValues?: Record<
		string,
		(() => string) | ((row: Record<string, any>) => string)
	>;
	/** Custom validation logic for entity operations */
	validation?: ValidationCallbacks;
}): void {
	const view_name = args.overrideName ?? args.schema["x-lix-key"];

	// Create the primary view (active only)
	createEntityStateView({
		...args,
		overrideName: view_name,
	});

	// Create the _all view (all versions)
	createEntityStateAllView({
		...args,
		overrideName: view_name + "_all",
	});

	// Create the _history view (historical states)
	createEntityStateHistoryView({
		lix: args.lix,
		schema: args.schema,
		overrideName: view_name + "_history",
	});
}
