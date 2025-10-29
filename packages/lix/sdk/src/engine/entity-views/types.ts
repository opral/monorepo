import type { EntityStateAllColumns } from "./entity-state-all.js";
import type { EntityStateColumns } from "./entity-state.js";
import type { StateEntityHistoryColumns } from "./entity-state-history.js";
import type { Generated as KyselyGenerated } from "kysely";
import type {
	LixGenerated,
	LixInsertable,
	LixUpdateable,
	LixSelectable,
} from "../../schema-definition/definition.js";

/**
 * Check if a type has the LixGenerated brand
 */
type IsLixGenerated<T> = T extends { readonly __lixGenerated?: true }
	? true
	: false;

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
 * View type for entities in the active version only.
 *
 * This type combines your entity properties with Lix operational columns
 * (file_id, timestamps, etc.) while preserving LixGenerated markers for
 * database schema compatibility.
 *
 * Use this type when defining database views that work with the current
 * active version only.
 *
 * @example
 * ```typescript
 * // Define a view type for key-value entities
 * type KeyValueView = EntityStateView<KeyValue>;
 *
 * // The resulting type includes both entity properties and operational columns
 * // { key: string, value: any, lixcol_file_id: LixGenerated<string>, ... }
 * ```
 */
export type EntityStateView<T> = T & EntityStateColumns;

/**
 * View type for entities across all versions.
 *
 * This type combines your entity properties with Lix operational columns
 * including the version_id, allowing you to query and manipulate entities
 * in specific versions.
 *
 * Use this type when defining database views that need to work across
 * multiple versions.
 *
 * @example
 * ```typescript
 * // Define a view type for key-value entities across versions
 * type KeyValueAllView = EntityStateAllView<KeyValue>;
 *
 * // Query entities in a specific version
 * await lix.db
 *   .selectFrom("key_value_all")
 *   .where("lixcol_version_id", "=", "v2")
 *   .selectAll()
 *   .execute();
 * ```
 */
export type EntityStateAllView<T> = T & EntityStateAllColumns;

/**
 * View type for entity history (read-only).
 *
 * This type combines your entity properties with historical tracking columns,
 * allowing you to see how entities evolved over time through different change sets.
 *
 * History views are read-only and include change tracking information like
 * change_id, change_set_id, and depth for blame functionality.
 *
 * @example
 * ```typescript
 * // Define a history view type for key-value entities
 * type KeyValueHistoryView = EntityStateHistoryView<KeyValue>;
 *
 * // Query entity state at a specific commit
 * await lix.db
 *   .selectFrom("key_value_history")
 *   .where("lixcol_commit_id", "=", commitId)
 *   .where("lixcol_depth", "=", 0)
 *   .selectAll()
 *   .execute();
 * ```
 */
export type EntityStateHistoryView<T> = T & StateEntityHistoryColumns;

/**
 * Type for querying entities from the active version.
 *
 * This type unwraps all LixGenerated markers, giving you the actual engine types
 * for entity properties and operational columns. Use this when working with
 * query results from the database or passing data to UI components.
 *
 * All properties are required and have their actual types (no LixGenerated wrappers).
 *
 * @example
 * ```typescript
 * // Use State type for UI components that display entity data
 * interface SettingsCardProps {
 *   setting: State<KeyValue>;
 * }
 *
 * function SettingsCard({ setting }: SettingsCardProps) {
 *   return (
 *     <div>
 *       <h3>{setting.key}</h3>
 *       <p>{setting.value}</p>
 *       <time>{setting.lixcol_updated_at}</time>
 *     </div>
 *   );
 * }
 *
 * // Query and pass to UI
 * const settings = await lix.db
 *   .selectFrom("key_value")
 *   .selectAll()
 *   .execute();
 *
 * settings.map(setting => <SettingsCard setting={setting} />);
 * ```
 */
export type State<T> = LixSelectable<EntityStateView<T>>;

/**
 * Type for querying entities across all versions.
 *
 * This type unwraps all LixGenerated markers and includes the version_id column,
 * allowing you to work with entities from any version in the database.
 *
 * All properties are required and have their actual types (no LixGenerated wrappers).
 *
 * @example
 * ```typescript
 * // Use StateAll for version comparison UI
 * interface VersionDiffProps {
 *   oldValue: StateAll<KeyValue>;
 *   newValue: StateAll<KeyValue>;
 * }
 *
 * function VersionDiff({ oldValue, newValue }: VersionDiffProps) {
 *   return (
 *     <div>
 *       <h4>{oldValue.key}</h4>
 *       <div>Version {oldValue.lixcol_version_id}: {oldValue.value}</div>
 *       <div>Version {newValue.lixcol_version_id}: {newValue.value}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export type StateAll<T> = LixSelectable<EntityStateAllView<T>>;

/**
 * Type for querying entity history.
 *
 * This type unwraps all LixGenerated markers and includes historical tracking
 * columns like change_id, change_set_id, and depth. Use this for blame
 * functionality and understanding how entities evolved.
 *
 * History queries are read-only.
 *
 * @example
 * ```typescript
 * // Use StateHistory for blame UI
 * interface BlameViewProps {
 *   history: StateHistory<KeyValue>[];
 * }
 *
 * function BlameView({ history }: BlameViewProps) {
 *   return (
 *     <ul>
 *       {history.map(state => (
 *         <li key={state.lixcol_change_id}>
 *           <strong>Depth {state.lixcol_depth}:</strong> {state.value}
 *           <br />
 *           <small>Change: {state.lixcol_change_id}</small>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export type StateHistory<T> = LixSelectable<EntityStateHistoryView<T>>;

/**
 * Type for creating new entities in the active version.
 *
 * This type makes all LixGenerated columns optional (like id, timestamps),
 * while keeping other required fields mandatory. The database will
 * automatically populate generated fields if not provided.
 *
 * @example
 * ```typescript
 * // Use NewState for form data types
 * interface SettingsFormData {
 *   setting: NewState<KeyValue>;
 * }
 *
 * async function createSetting(formData: SettingsFormData) {
 *   // Only key and value are required
 *   const newSetting: NewState<KeyValue> = {
 *     key: formData.setting.key,
 *     value: formData.setting.value
 *     // lixcol_created_at, lixcol_file_id etc. are auto-generated
 *   };
 *
 *   await lix.db
 *     .insertInto("key_value")
 *     .values(newSetting)
 *     .execute();
 * }
 * ```
 */
export type NewState<T> = LixInsertable<EntityStateView<T>>;

/**
 * Type for updating entities in the active version.
 *
 * This type makes all columns optional, allowing partial updates.
 * Only include the fields you want to change - the database will
 * preserve existing values for omitted fields.
 *
 * @example
 * ```typescript
 * // Use StateUpdate for update form data
 * interface UpdateSettingData {
 *   updates: StateUpdate<KeyValue>;
 * }
 *
 * async function updateSetting(key: string, updates: UpdateSettingData) {
 *   // Only update the fields that changed
 *   const patch: StateUpdate<KeyValue> = {
 *     value: updates.updates.value
 *     // key, timestamps, etc. remain unchanged
 *   };
 *
 *   await lix.db
 *     .updateTable("key_value")
 *     .set(patch)
 *     .where("key", "=", key)
 *     .execute();
 * }
 * ```
 */
export type StateUpdate<T> = LixUpdateable<EntityStateView<T>>;

/**
 * Type for creating new entities with version control.
 *
 * This type includes lixcol_version_id for creating entities in specific
 * versions. Like NewState, it makes LixGenerated columns optional.
 *
 * @example
 * ```typescript
 * // Use NewStateAll for version-specific creation
 * async function createFeatureFlag(versionId: string, flag: {
 *   key: string;
 *   value: boolean;
 * }) {
 *   const newFlag: NewStateAll<KeyValue> = {
 *     key: flag.key,
 *     value: flag.value,
 *     lixcol_version_id: versionId  // Create in specific version
 *   };
 *
 *   await lix.db
 *     .insertInto("key_value_all")
 *     .values(newFlag)
 *     .execute();
 * }
 * ```
 */
export type NewStateAll<T> = LixInsertable<EntityStateAllView<T>>;

/**
 * Type for updating entities in specific versions.
 *
 * This type makes all columns optional for partial updates and includes
 * version control. You can update entities in any version or change
 * an entity's version.
 *
 * @example
 * ```typescript
 * // Use StateAllUpdate for version-specific updates
 * async function toggleFeatureFlag(
 *   key: string,
 *   versionId: string,
 *   enabled: boolean
 * ) {
 *   const updates: StateAllUpdate<KeyValue> = {
 *     value: enabled
 *   };
 *
 *   await lix.db
 *     .updateTable("key_value_all")
 *     .set(updates)
 *     .where("key", "=", key)
 *     .where("lixcol_version_id", "=", versionId)
 *     .execute();
 * }
 * ```
 */
export type StateAllUpdate<T> = LixUpdateable<EntityStateAllView<T>>;
