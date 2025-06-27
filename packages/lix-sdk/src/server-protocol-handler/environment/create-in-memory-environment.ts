import { openLix } from "../../lix/open-lix.js";
import type { Lix } from "../../lix/open-lix.js";
import { toBlob } from "../../lix/to-blob.js";
import type { LspEnvironment } from "./environment.js";

/**
 * Create an in-memory storage.
 *
 * Great for testing or quick prototyping.
 */
export const createLspInMemoryEnvironment = (): LspEnvironment => {
	const store = new Map<string, Blob>();

	/**
	 * Map of open lixes.
	 *
	 * @example
	 *   openLixes.set('id', lix);
	 *   openLixes.delete('id');
	 *   openLixes.has('id');
	 */
	const openLixes = new Map<string, Lix>();

	/**
	 * Map of open connections.
	 *
	 * @example
	 *   openConnections['lix-id'].add('connection-id');
	 *   openConnections['lix-id'].delete('connection-id');
	 *   openConnections['lix-id'].has('connection-id');
	 *   openConnections['lix-id'].size;
	 */
	const openConnections = new Map<string, Set<string>>();

	return {
		async hasLix(args) {
			return store.has(args.id);
		},

		async getLix(args) {
			return store.get(args.id);
		},

		async setLix(args) {
			store.set(args.id, args.blob);
		},

		async openLix(args) {
			const connectionId = Math.random().toString(36).slice(2);
			let lix: Lix;

			// TODO no concurrency guarantees
			if (openLixes.has(args.id)) {
				lix = openLixes.get(args.id)!;
			} else {
				const blob = store.get(args.id);
				lix = await openLix({
					blob,
					// don't sync the server with itself
					keyValues: [{ key: "lix_sync", value: "false" }],
				});

				lix.sqlite.exec("PRAGMA foreign_keys = OFF;");

				openLixes.set(args.id, lix);
			}

			if (openConnections.has(args.id)) {
				openConnections.get(args.id)!.add(connectionId);
			} else {
				openConnections.set(args.id, new Set([connectionId]));
			}

			return { lix, id: args.id, connectionId };
		},

		async closeLix(args: { id: string; connectionId: string }): Promise<void> {
			const connections = openConnections.get(args.id);
			if (!connections) {
				throw new Error(`No open connections for lix ${args.id}`);
			}

			connections.delete(args.connectionId);

			if (connections.size === 0) {
				// TODO no concurrency guarantees
				const lix = openLixes.get(args.id);
				// await fileQueueSettled({ lix: lix! });
				const blob = await toBlob({ lix: lix! });
				await lix!.close();
				openConnections.delete(args.id);
				openLixes.delete(args.id);
				store.set(args.id, blob);
			}
		},
	};
};

// For backward compatibility
export const createLsaInMemoryEnvironment: typeof createLspInMemoryEnvironment =
	createLspInMemoryEnvironment;
