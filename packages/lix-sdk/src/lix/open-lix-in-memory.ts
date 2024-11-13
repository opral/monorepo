import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely";
import { openLix } from "./open-lix.js";

/**
 * Opens a lix in memory.
 *
 * @param args.blob - The lix file to open. If not provided, an empty (new) lix will be opened.
 */
export async function openLixInMemory(
	args: { blob?: Blob } & Omit<Parameters<typeof openLix>[0], "database">,
): Promise<ReturnType<typeof openLix>> {
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	if (args.blob) {
		importDatabase({
			db: database,
			content: new Uint8Array(await args.blob.arrayBuffer()),
		});
	}

	return openLix({ ...args, database });
}
