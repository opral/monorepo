export const unhandled = (type: never): never => { throw new Error(`unhandled case: '${type}'`) }

export type MaybePromise<T> = T | Promise<T>
