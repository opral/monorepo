import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import type { Lix } from "../../lix/open-lix.js";
import type { LsaEnvironment } from "./environment.js";

/**
 * Create an in-memory storage.
 *
 * Great for testing or quick prototyping.
 */
export const createLsaInMemoryEnvironment = (): LsaEnvironment => {
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
		async get(key: string): Promise<Blob | undefined> {
			return store.get(key);
		},

		async set(key: string, value: Blob): Promise<void> {
			store.set(key, value);
		},

		async delete(key: string): Promise<void> {
			store.delete(key);
		},

		async has(key: string): Promise<boolean> {
			return store.has(key);
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
				lix = await openLixInMemory({ blob });
				openLixes.set(args.id, lix);
			}

			if (openConnections.has(args.id)) {
				openConnections.get(args.id)!.add(connectionId);
			} else {
				openConnections.set(args.id, new Set([connectionId]));
			}

			return [lix, connectionId];
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
				const blob = await lix!.toBlob();
				await lix?.close();
				openConnections.delete(args.id);
				openLixes.delete(args.id);
				store.set(args.id, blob);
			}
		},
	};
};
