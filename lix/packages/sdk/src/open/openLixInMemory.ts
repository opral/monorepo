import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely";
import { openLix } from "./openLix.js";

/**
 *
 */
export async function openLixInMemory(
	args: { blob: Blob } & Omit<Parameters<typeof openLix>[0], "database">,
) {
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	importDatabase({
		db: database,
		content: new Uint8Array(await args.blob.arrayBuffer()),
	});

	return openLix({ ...args, database });
}
