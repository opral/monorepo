import { createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely";
import { openLix } from "./open-lix.js";
import { newLixFile } from "./new-lix.js";

/**
 * Loads a Lix file into a temporary in‑memory database.
 *
 * The returned instance behaves like {@link openLix} but keeps all
 * data only for the lifetime of the current JavaScript context. If no
 * blob is provided a fresh Lix project is created automatically.
 *
 * @example
 * ```ts
 * const lix = await openLixInMemory({})
 * ```
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
