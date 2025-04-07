import type { Lix } from "@lix-js/sdk";
import { useQuery } from "./use-query.ts";
import { useLix } from "./use-lix.ts";

// Define the schema for *known* keys and their value types
interface InspectorKeyValueSchema {
  "inspector.graphView.zoomLevel": number;
  "inspector.tableView.columnVisibility": Record<string, boolean>;
  "inspector.userPreferences.theme": "light" | "dark";
}

// Extract the valid *known* keys from the schema
type ValidKeyValue = keyof InspectorKeyValueSchema;

/**
 * A hook that provides persistent key-value storage using the Lix database.
 * Provides type safety for keys defined in InspectorKeyValueSchema,
 * defaults to `any` for other keys.
 *
 * @example
 *   // Known key: type is inferred as number | null
 *   const [zoom, setZoom] = useKeyValue("inspector.graphView.zoomLevel");
 *   setZoom(1.5); // expects number
 *
 *   // Unknown key: type is inferred as any | null
 *   const [customData, setCustomData] = useKeyValue("some.other.key");
 *   setCustomData({ foo: "bar" }); // accepts any
 *
 * @param key - The unique key to store the value under. Can be any string.
 * @returns A tuple of [value, setValue] with types inferred if the key is known.
 */
// 1. Allow any string key, K extends string
export function useKeyValue<K extends string>(key: K) {
  const lix = useLix();
  // 2. Conditional type: If K is a known key, use its schema type, else use any
  type T = K extends ValidKeyValue ? InspectorKeyValueSchema[K] : any;

  // Type T is passed to selectKeyValue
  const [value, , , refetch] = useQuery(() => selectKeyValue<T>(lix, key), 75);

  // setValue expects the inferred type T
  const setValue = async (newValue: T) => {
    // Pass inferred type T to upsertKeyValue
    await upsertKeyValue<T>(lix, key, newValue);
    refetch();
  };

  // Return type reflects the potentially any type T
  return [value as T | null, setValue] as const;
}

/**
 * Retrieves the value associated with a key from the Lix database.
 */
// 3. Remove ValidKeyValue constraint from key parameter
async function selectKeyValue<T>(lix: Lix, key: string): Promise<T | null> {
  const result = await lix.db
    .selectFrom("key_value")
    .where("key", "=", key)
    .select(["value"])
    .executeTakeFirst();

  // Cast to T (which could be a specific type or any)
  return result ? (result.value as T) : null;
}

/**
 * Upserts a key-value pair into the Lix database.
 */
// 3. Remove ValidKeyValue constraint from key parameter
//    Keep generic T for value to match setValue's expectation
async function upsertKeyValue<T>(lix: Lix, key: string, value: T) {
  const jsonValue = JSON.stringify(value);

  await lix.db
    .insertInto("key_value")
    .values({ key, value: jsonValue })
    .onConflict((oc) => oc.doUpdateSet({ value: jsonValue }))
    .execute();

  return value;
}
