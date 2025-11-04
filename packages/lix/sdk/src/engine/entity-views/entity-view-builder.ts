import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";
import { type StateEntityView } from "./entity-state.js";
import { type StateEntityByVersionView } from "./entity-state-by-version.js";
import { type StateEntityHistoryView } from "./entity-state-history.js";
import type {
	EntityStateView,
	EntityStateByVersionView,
	EntityStateHistoryView,
	ToKysely,
} from "./types.js";

// Re-export types for backward compatibility
export type {
	StateEntityView,
	StateEntityByVersionView,
	StateEntityHistoryView,
};

/**
 * Utility type that generates database schema view entries for an entity schema.
 * Creates three views: active version, per-version (`_by_version`), and history.
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
	[K in `${TViewName}_by_version`]: ToKysely<
		EntityStateByVersionView<FromLixSchemaDefinition<TSchema> & TOverride>
	>;
} & {
	[K in `${TViewName}_history`]: ToKysely<
		EntityStateHistoryView<FromLixSchemaDefinition<TSchema> & TOverride>
	>;
};
