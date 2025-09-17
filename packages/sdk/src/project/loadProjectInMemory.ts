import { openLix, type LixKeyValue, type NewState } from "@lix-js/sdk";
import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely";
import { loadProject } from "./loadProject.js";
import { applySchema } from "../database/schema.js";

/**
 * Load a project from a blob in memory.
 */
export async function loadProjectInMemory(
	args: {
		blob: Blob;
		lixKeyValues?: NewState<LixKeyValue>[];
	} & Omit<Parameters<typeof loadProject>[0], "sqlite" | "lix">
) {
	const lix = await openLix({
		blob: args.blob,
		account: args.account,
		keyValues: args.lixKeyValues,
		providePlugins: [
			// inlangLixPluginV1
		],
	});

	const dbFile = await lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/db.sqlite")
		.executeTakeFirst();

	const sqlite = await createInMemoryDatabase({});

	if (dbFile) {
		importDatabase({ db: sqlite, content: new Uint8Array(dbFile.data) });
	} else {
		applySchema({ sqlite });
	}

	return await loadProject({
		// pass common arguments to loadProject
		...args,
		sqlite,
		lix,
	});
}
