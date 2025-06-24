import type { EntityStateAllColumns } from "./entity-state-all.js";
import type { EntityStateColumns } from "./entity-state.js";
import type { StateEntityHistoryColumns } from "./entity-state-history.js";
import type { Generated as KyselyGenerated } from "kysely";
import type {
	LixGenerated,
	LixInsertable,
	LixUpdateable,
	LixSelectable,
} from "../schema-definition/definition.js";

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
 * Convert our LixGenerated types to Kysely's Generated types.
 * This adapter is used at the database boundary.
 */
export type ToKysely<T> = {
	[K in keyof T]: IsLixGenerated<T[K]> extends true
		? KyselyGenerated<SelectType<T[K]>>
		: T[K];
};

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

