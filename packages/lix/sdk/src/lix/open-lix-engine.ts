import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixBackend } from "../backend/types.js";
import { createDialect } from "../backend/kysely/kysely-driver.js";

/**
 * Experimental: Open a Lix-like instance backed by a LixBackend.
 *
 * This variant does not initialize the Lix database schema. It assumes the
 * engine was initialized with an existing database blob (or takes
 * responsibility for schema creation on its own). It provides a Kysely DB
 * connection and helpers to export/close.
 *
 * For full Lix behavior (schema, vtable, hooks), use the classic openLix()
 * until the schema initialization is available inside the engine.
 */
export async function openLixBackend(args: {
	backend: LixBackend;
	blob?: ArrayBuffer;
	expProvideStringifiedPlugins?: string[];
}): Promise<{
	db: Kysely<LixDatabaseSchema>;
	close: () => Promise<void>;
	toBlob: () => Promise<Blob>;
}> {
	await args.backend.init({
		blob: args.blob,
		expProvideStringifiedPlugins: args.expProvideStringifiedPlugins,
	});

	const db = new Kysely<LixDatabaseSchema>({
		dialect: createDialect({ backend: args.backend }),
	});

	return {
		db,
		close: async () => {
			await args.backend.close();
		},
		toBlob: async () => {
			return new Blob([await args.backend.export()]);
		},
	};
}

// Temporary alias for backwards compatibility while migrating terminology.
// (no alias)
