import type { Lix } from "../lix/open-lix.js";
import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
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
} from "./entity-state-history.js";
import type {
	EntityStateView,
	EntityStateAllView,
	EntityStateHistoryView,
	ToKysely,
} from "./types.js";

// Re-export types for backward compatibility
export type { StateEntityView, StateEntityAllView, StateEntityHistoryView };
export type { ValidationRule, ValidationCallbacks };

/**
 * Utility type that generates database schema view entries for an entity schema.
 * Creates three views: normal (active version), all versions, and history.
 *
 * TSchema should be a LixSchemaDefinition (typeof SomeSchema).
 * TOverride allows you to provide partial type overrides for specific properties.
 *
 * @example
 * ```typescript
 * // Basic usage with schema definition
 * type LogViews = EntityViews<typeof LixLogSchema, "log">;
 *
 * // With partial property override
 * type ThreadCommentViews = EntityViews<
 *   typeof LixThreadCommentSchema,
 *   "thread_comment",
 *   { body: ZettelDoc }
 * >;
 * ```
 */
export type EntityViews<
	TSchema extends LixSchemaDefinition,
	TViewName extends string,
	TOverride = object,
> = {
	[K in TViewName]: ToKysely<
		EntityStateView<FromLixSchemaDefinition<TSchema> & TOverride>
	>;
} & {
	[K in `${TViewName}_all`]: ToKysely<
		EntityStateAllView<FromLixSchemaDefinition<TSchema> & TOverride>
	>;
} & {
	[K in `${TViewName}_history`]: ToKysely<
		EntityStateHistoryView<FromLixSchemaDefinition<TSchema> & TOverride>
	>;
};

/**
 * Creates SQL views and CRUD triggers for an entity based on its schema definition.
 *
 * This function automatically generates three views:
 * - Primary view (e.g., "key_value") - uses state (active version only)
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
		(() => any) | ((row: Record<string, any>) => any)
	>;
	/** Custom validation logic for entity operations */
	validation?: ValidationCallbacks;
	/** If true, creates read-only views (no INSERT/UPDATE/DELETE triggers) */
	readOnly?: boolean;
}): void {
	const view_name = args.overrideName ?? args.schema["x-lix-key"];

	// Create the primary view (active only)
	createEntityStateView({
		...args,
		overrideName: view_name,
		readOnly: args.readOnly,
	});

	// Create the _all view (all versions)
	createEntityStateAllView({
		...args,
		overrideName: view_name + "_all",
		readOnly: args.readOnly,
	});

	// Create the _history view (historical states)
	createEntityStateHistoryView({
		lix: args.lix,
		schema: args.schema,
		overrideName: view_name + "_history",
	});
}
