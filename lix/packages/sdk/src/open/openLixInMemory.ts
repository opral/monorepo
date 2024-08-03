import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely"
import { openLix } from "./openLix.js"

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
	return openLix({ database })
}
