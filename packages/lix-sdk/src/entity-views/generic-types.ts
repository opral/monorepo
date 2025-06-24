import type { EntityStateAllColumns } from "./entity-state-all.js";
import type { EntityStateColumns } from "./entity-state.js";
import type { StateEntityHistoryColumns } from "./entity-state-history.js";
import type { Generated as KyselyGenerated } from "kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";

/**
 * Our own Generated marker type for database columns that are auto-generated.
 * This allows us to control type transformations independently of Kysely.
 * 
 * Note: For developer convenience, this accepts T values but preserves
 * the generated marker for type transformations.
 */
export type LixGenerated<T> = T & {
	readonly __lixGenerated?: true;
};

/**
 * Check if a type has the LixGenerated brand
 */
type IsLixGenerated<T> = T extends { readonly __lixGenerated?: true } ? true : false;

/**
 * Extract the base type from LixGenerated<T>
 * Since LixGenerated<T> = T & { brand }, we need to extract T
 */
type ExtractFromGenerated<T> = T extends LixGenerated<infer U> ? U : T;

/**
 * Extract the select type from LixGenerated or return the type as-is
 */
type SelectType<T> = ExtractFromGenerated<T>;

/**
 * Extract the insert type from LixGenerated or return the type as-is
 */
type InsertType<T> = IsLixGenerated<T> extends true ? ExtractFromGenerated<T> | undefined : T;

/**
 * Extract the update type from LixGenerated or return the type as-is
 */
type UpdateType<T> = ExtractFromGenerated<T>;

/**
 * Evaluates to K if T can be null or undefined
 */
type IfNullable<T, K> = undefined extends T ? K : null extends T ? K : never;

/**
 * Evaluates to K if T can't be null or undefined
 */
type IfNotNullable<T, K> = undefined extends T
	? never
	: null extends T
		? never
		: T extends never
			? never
			: K;

/**
 * Keys whose InsertType can be null or undefined (optional in inserts)
 */
type NullableInsertKeys<T> = {
	[K in keyof T]: IfNullable<InsertType<T[K]>, K>;
}[keyof T];

/**
 * Keys whose InsertType can't be null or undefined (required in inserts)
 */
type NonNullableInsertKeys<T> = {
	[K in keyof T]: IfNotNullable<InsertType<T[K]>, K>;
}[keyof T];

/**
 * Transform a type to make LixGenerated fields optional (for inserts).
 * Non-generated fields remain required.
 */
export type LixInsertable<T> = {
	[K in NonNullableInsertKeys<T>]: InsertType<T[K]>;
} & {
	[K in NullableInsertKeys<T>]?: InsertType<T[K]>;
};

/**
 * Transform a type to make all fields optional (for updates).
 * LixGenerated fields are unwrapped to their base type.
 */
export type LixUpdateable<T> = {
	[K in keyof T]?: UpdateType<T[K]>;
};

/**
 * Transform a type to unwrap LixGenerated fields (for selects).
 * This gives you the actual runtime types.
 */
export type LixSelectable<T> = {
	[K in keyof T]: SelectType<T[K]>;
};

/**
 * Convert our LixGenerated types to Kysely's Generated types.
 * This adapter is used at the database boundary.
 */
export type ToKysely<T> = {
	[K in keyof T]: IsLixGenerated<T[K]> extends true
		? KyselyGenerated<SelectType<T[K]>>
		: T[K];
};

/**
 * Creates an entity view type from a LixSchemaDefinition.
 * Properties marked with x-lix-generated: true are wrapped in LixGenerated.
 * 
 * This is a simplified version that manually checks each property.
 * 
 * @example
 * ```typescript
 * const LogSchema = {
 *   properties: {
 *     id: { type: "string", "x-lix-generated": true },
 *     name: { type: "string" }
 *   }
 * } as const;
 * 
 * type LogView = EntityView<typeof LogSchema>;
 * // Result: { id: LixGenerated<string>, name: string }
 * ```
 */
export type EntityView<TSchema extends LixSchemaDefinition> = TSchema extends {
	properties: infer Props;
}
	? {
			[K in keyof FromLixSchemaDefinition<TSchema>]: K extends keyof Props
				? Props[K] extends { "x-lix-generated": true }
					? LixGenerated<FromLixSchemaDefinition<TSchema>[K]>
					: FromLixSchemaDefinition<TSchema>[K]
				: FromLixSchemaDefinition<TSchema>[K];
		}
	: never;

/**
 * View type that preserves Generated markers for database schema.
 * This type is used in the database schema to ensure Kysely recognizes generated columns.
 *
 * @example
 * ```typescript
 * type KeyValueView = StateEntityView<LixKeyValue>;
 * ```
 */
export type EntityStateView<T> = T & EntityStateColumns;

/**
 * View type for all versions that preserves Generated markers.
 *
 * @example
 * ```typescript
 * type KeyValueAllView = StateEntityAllView<LixKeyValue>;
 * ```
 */
export type EntityStateAllView<T> = T & EntityStateAllColumns;

/**
 * View type for history that preserves Generated markers.
 *
 * @example
 * ```typescript
 * type KeyValueHistoryView = StateEntityHistoryView<LixKeyValue>;
 * ```
 */
export type EntityStateHistoryView<T> = T & StateEntityHistoryColumns;

/**
 * Generic type for entity state (active version only).
 * Unwraps LixGenerated<T> columns to their underlying types for select operations.
 *
 * @example
 * ```typescript
 * type KeyValue = State<LixKeyValue>;
 * ```
 */
export type State<T> = LixSelectable<EntityStateView<T>>;

/**
 * Generic type for entity state across all versions.
 * Unwraps LixGenerated<T> columns to their underlying types for select operations.
 *
 * @example
 * ```typescript
 * type KeyValueAll = StateAll<LixKeyValue>;
 * ```
 */
export type StateAll<T> = LixSelectable<EntityStateAllView<T>>;

/**
 * Generic type for entity history state.
 * Unwraps LixGenerated<T> columns to their underlying types for select operations.
 *
 * @example
 * ```typescript
 * type KeyValueHistory = StateHistory<LixKeyValue>;
 * ```
 */
export type StateHistory<T> = LixSelectable<EntityStateHistoryView<T>>;

/**
 * Generic type for creating new entity state (active version).
 * Uses LixInsertable to make generated columns optional.
 *
 * @example
 * ```typescript
 * type NewKeyValue = NewState<LixKeyValue>;
 * ```
 */
export type NewState<T> = LixInsertable<EntityStateView<T>>;

/**
 * Generic type for updating entity state (active version).
 * Uses LixUpdateable to make all columns optional.
 *
 * @example
 * ```typescript
 * type KeyValueUpdate = StateUpdate<LixKeyValue>;
 * ```
 */
export type StateUpdate<T> = LixUpdateable<EntityStateView<T>>;

/**
 * Generic type for creating new entity state (all versions).
 * Uses LixInsertable to make generated columns optional.
 *
 * @example
 * ```typescript
 * type NewKeyValueAll = NewStateAll<LixKeyValue>;
 * ```
 */
export type NewStateAll<T> = LixInsertable<EntityStateAllView<T>>;

/**
 * Generic type for updating entity state (all versions).
 * Uses LixUpdateable to make all columns optional.
 *
 * @example
 * ```typescript
 * type KeyValueAllUpdate = StateAllUpdate<LixKeyValue>;
 * ```
 */
export type StateAllUpdate<T> = LixUpdateable<EntityStateAllView<T>>;

// Re-export EntityViews from entity-view-builder for convenience
export type { EntityViews } from "./entity-view-builder.js";
