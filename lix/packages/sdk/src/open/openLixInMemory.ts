import { SQLocalKysely } from "sqlocal/kysely"
import { setup } from "./setup.js"

/**
 *
 */
export async function openLixInMemory(args: { blob: Blob }) {
	const sqlocal = new SQLocalKysely({
		storage: {
			type: "memory",
			// TODO @martin-lysk doesn't load from memory
			dbContent: await args.blob.arrayBuffer(),
		},
	})

	return setup({ sqlocal })
}
