import { openLix, type LixKeyValue, type NewStateByVersion } from "@lix-js/sdk";
import { loadProject } from "./loadProject.js";

/**
 * Load a project from a blob in memory.
 */
export async function loadProjectInMemory(
	args: {
		blob: Blob;
		lixKeyValues?: NewStateByVersion<LixKeyValue>[];
	} & Omit<Parameters<typeof loadProject>[0], "lix">
) {
	const lix = await openLix({
		blob: args.blob,
		account: args.account,
		keyValues: args.lixKeyValues,
	});
	return await loadProject({
		// pass common arguments to loadProject
		...args,
		lix,
	});
}
