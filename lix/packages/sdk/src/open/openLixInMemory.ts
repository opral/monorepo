import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely"
import { openLix } from "./openLix.js"

/**
 *
 */
export async function openLixInMemory(
	args: { blob?: Blob; arrayBuffer?: ArrayBuffer } & Omit<Parameters<typeof openLix>[0], "database">
) {
	let arrayBuffer = args.arrayBuffer
	if (args.blob) {
		arrayBuffer = await args.blob.arrayBuffer()
	}

	const database = await createInMemoryDatabase({
		readOnly: false,
	})
	importDatabase({
		db: database,
		content: new Uint8Array(arrayBuffer!),
	})
	return openLix({ ...args, database })
}
