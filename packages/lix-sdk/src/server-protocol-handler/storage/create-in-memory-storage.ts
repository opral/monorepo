import type { Storage } from "./storage.js";

/**
 * Create an in-memory storage.
 *
 * Great for testing or quick prototyping.
 */
export const createInMemoryLspHandlerStorage = (): Storage => {
	const store = new Map<string, Blob>();

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
	};
};
