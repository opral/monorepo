import type * as V2 from "../v2/types.js"

/**
 * WIP async V2 store interface
 * E.g. `await project.store.messageBundles.get({ id: "..." })`
 **/
export type StoreApi = {
	messageBundles: Store<V2.MessageBundle>
}

export interface Store<T> {
	// TODO: remove reload when fs.watch can trigger auto-invalidation
	reload: () => Promise<void>

	get: (args: { id: string }) => Promise<T | undefined>
	set: (args: { data: T }) => Promise<void>
	delete: (args: { id: string }) => Promise<void>
	getAll: () => Promise<T[]>
}
