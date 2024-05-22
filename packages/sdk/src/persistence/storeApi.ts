import type * as V2 from "../v2/types.js"

export type StoreApi = {
	messageBundles: Query<V2.MessageBundle>
}

/**
 * WIP template for async V2 crud interfaces
 * E.g. `await project.messageBundles.get({ id: "..." })`
 **/
export interface Query<T> {
	get: (args: { id: string }) => Promise<T | undefined>
	getAll: () => Promise<T[]>
}
