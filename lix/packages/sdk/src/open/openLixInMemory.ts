import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely"
import { setup } from "./setup.js"

/**
 *
 */
export async function openLixInMemory(args: { blob: Blob }) {
	const database = await createInMemoryDatabase({
		readOnly: false,
	})
	importDatabase({
		db: database,
		content: new Uint8Array(await args.blob.arrayBuffer()),
	})
	return setup({ database })
}
