import type { Result } from "./api.js"

/**
 * Try catch wrapper for functions that can throw errors.
 *
 * @example
 *   const result = tryCatch(() => failingFunction())
 *   result.data
 *   result.error
 *
 *   const result = await tryCatch(() => asyncFailingFunction())
 */
export function tryCatch<Data>(callback: () => Promise<Data>): Promise<Result<Data, Error>>
export function tryCatch<Data>(callback: () => Data): Result<Data, Error>
export function tryCatch<Data>(
	callback: () => Data | Promise<Data>,
): Promise<Result<Data, Error>> | Result<Data, Error> {
	try {
		const callbackResult = callback() as Data | Promise<Data>
		if (isAsync(callbackResult)) {
			return callbackResult
				.then((data) => ({ data }))
				.catch((e) => {
					if (e instanceof Error) {
						return { error: e }
					}
					return { error: new Error(`Unknown error has been caught: ${e}`, { cause: e }) }
				})
		}
		return { data: callbackResult }
	} catch (e) {
		if (e instanceof Error) {
			return { error: e }
		}
		return { error: new Error(`Unknown error has been caught: ${e}`, { cause: e }) }
	}
}

const isAsync = <T>(p: unknown): p is Promise<T> =>
	!!p && typeof p === "object" && typeof (p as Promise<T>).then === "function"
