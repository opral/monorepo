import type { Lix } from "@lix-js/sdk";
import { useQuery } from "@lix-js/react-utils";
import { useLix } from "./use-lix.ts";

// Define the schema for *known* keys and their value types
interface InspectorKeyValueSchema {
  "inspector.graphView.zoomLevel": number;
  "inspector.tableView.columnVisibility": Record<string, boolean>;
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
export function useKeyValue<K extends string>(key: K) {
  const lix = useLix();
  type T = K extends ValidKeyValue ? InspectorKeyValueSchema[K] : any;

  // The new useQuery API doesn't return a refetch function or use polling
  // We'll need to use the database directly for setValue
  const keyValueData = useQuery(({ lix }) => 
    lix.db
      .selectFrom("key_value")
      .where("key", "=", key)
      .select(["value"])
  );

  // Extract the value from the query result
  const value = keyValueData.length > 0 ? (JSON.parse(keyValueData[0]!.value) as T) : null;

  // setValue expects the inferred type T
  const setValue = async (
    newValue: T
    // options?: { skipChangeControl?: boolean }
  ) => {
    // Pass inferred type T to upsertKeyValue
    await upsertKeyValue<T>(lix, key, newValue);
    // The new useQuery will automatically update due to subscription
  };

  // Return type reflects the potentially any type T
  return [value as T | null, setValue] as const;
}


/**
 * Upserts a key-value pair into the Lix database.
 */
async function upsertKeyValue<T>(
  lix: Lix,
  key: string,
  value: T
  // options?: { skipChangeControl?: boolean }
) {
  const jsonValue = JSON.stringify(value);

  await lix.db
    .insertInto("key_value")
    .values({
      key,
      value: jsonValue,
      // skip_change_control: options?.skipChangeControl,
    })
    .onConflict((oc) => oc.doUpdateSet({ value: jsonValue }))
    .execute();

  return value;
}
