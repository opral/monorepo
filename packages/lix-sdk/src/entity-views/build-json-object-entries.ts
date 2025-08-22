import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { isJsonType } from "../schema-definition/json-type.js";

/**
 * Builds a json_object entries list for snapshot_content serialization that respects schema types.
 * - For JSON-like props (object/array): accept raw JSON when valid, otherwise quote
 * - For string props: always json_quote to avoid coercion (e.g. "1.0" -> 1)
 * - For others (number/boolean/null): generic JSON handling
 */
export function buildJsonObjectEntries(args: {
  schema: LixSchemaDefinition;
  ref: (prop: string) => string;
}): string {
  const properties = Object.keys((args.schema as any).properties);

  return properties
    .map((prop) => {
      const def: any = (args.schema as any).properties[prop];
      const ref = args.ref(prop);
      const jsonLike = isJsonType(def);
      const types = def?.type ? (Array.isArray(def.type) ? def.type : [def.type]) : [];
      const isString = !jsonLike && types.includes("string");

      if (jsonLike) {
        return `'${prop}', CASE WHEN json_valid(${ref}) THEN json(${ref}) ELSE json_quote(${ref}) END`;
      }
      if (isString) {
        return `'${prop}', json_quote(${ref})`;
      }
      return `'${prop}', CASE WHEN json_valid(${ref}) THEN json(${ref}) ELSE json_quote(${ref}) END`;
    })
    .join(", ");
}

