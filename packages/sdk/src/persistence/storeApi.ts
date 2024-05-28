import type * as V2 from "../v2/types.js"

export type StoreApi = {
	messageBundles: Query<V2.MessageBundle>
}

/**
 * WIP template for async V2 crud interfaces
 * E.g. `await project.messageBundles.get({ id: "..." })`
 **/
export interface Query<T> {
	reload: () => Promise<void>
	get: (args: { id: string }) => Promise<T | undefined>
	set: (args: { data: T }) => Promise<void>
	delete: (args: { id: string }) => Promise<void>
	getAll: () => Promise<T[]>
}
