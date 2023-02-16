import { inspect } from 'util';

export const unhandled = (type: never, context?: unknown): never => {
	throw new Error(`unhandled case: '${type}'${context ? ` for ${inspect(context)}` : ''}`)
}

export type MaybePromise<T> = T | Promise<T>

export const debug = (element: unknown) => console.debug(inspect(element, false, 999))
