import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely";
import { openLix } from "./open-lix.js";
import { newLixFile } from "./new-lix.js";

/**
 * Opens a lix in memory.
 *
 */
export async function openLixInMemory(
	args: {
		/**
		 * The lix file to open. If not provided, an empty (new) lix will be opened.
		 */
		blob?: Blob;
	} & Omit<Parameters<typeof openLix>[0], "database">
): Promise<ReturnType<typeof openLix>> {
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	const blob = args.blob ?? (await newLixFile());

	importDatabase({
		db: database,
		content: new Uint8Array(await blob.arrayBuffer()),
	});

	return openLix({ ...args, database });
}
