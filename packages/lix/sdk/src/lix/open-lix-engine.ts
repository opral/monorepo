import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixEngine } from "../engine/types.js";
import { createDialect } from "../engine/driver/engine-driver.js";

/**
 * Experimental: Open a Lix-like instance backed by a LixEngine.
 *
 * This variant does not initialize the Lix database schema. It assumes the
 * engine was initialized with an existing database blob (or takes
 * responsibility for schema creation on its own). It provides a Kysely DB
 * connection and helpers to export/close.
 *
 * For full Lix behavior (schema, vtable, hooks), use the classic openLix()
 * until the schema initialization is available inside the engine.
 */
export async function openLixEngine(args: {
  engine: LixEngine;
  blob?: ArrayBuffer;
  expProvideStringifiedPlugins?: string[];
}): Promise<{
  db: Kysely<LixDatabaseSchema>;
  close: () => Promise<void>;
  toBlob: () => Promise<Blob>;
}> {
  await args.engine.init({
    blob: args.blob,
    expProvideStringifiedPlugins: args.expProvideStringifiedPlugins,
  });

  const db = new Kysely<LixDatabaseSchema>({
    dialect: createDialect({ engine: args.engine }),
  });

  return {
    db,
    close: async () => {
      await args.engine.close();
    },
    toBlob: async () => {
      return new Blob([await args.engine.export()]);
    },
  };
}
