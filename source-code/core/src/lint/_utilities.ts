import { inspect } from 'util';

export const unhandled = (type: never): never => { throw new Error(`unhandled case: '${type}'`) }

export type MaybePromise<T> = T | Promise<T>

export const debug = (element: unknown) => console.info(inspect(element, false, 999))
