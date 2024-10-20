import type { ProjectSettings } from "../interface.js";
import { migrate1to2 } from "./1-to-2.js";

/**
 * Migrates the schema to the latest version if required.
 */
export function migrateIfOutdated(schema: any): ProjectSettings {
  if (schema.settings) {
    return migrate1to2(schema);
  }
  return schema as ProjectSettings;
}
