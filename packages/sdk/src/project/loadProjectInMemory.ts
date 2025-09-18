import { openLix, type LixKeyValue, type NewState } from "@lix-js/sdk";
import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { loadProject } from "./loadProject.js";

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
	});

	const sqlite = await createInMemoryDatabase({});

	return await loadProject({
		// pass common arguments to loadProject
		...args,
		sqlite,
		lix,
	});
}
