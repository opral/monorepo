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
export function tryCatch<Data>(callback: () => Promise<Data>): Promise<Result<Data, unknown>>
export function tryCatch<Data>(callback: () => Data): Result<Data, unknown>
export function tryCatch<Data>(
	callback: () => Data | Promise<Data>,
): Promise<Result<Data, unknown>> | Result<Data, unknown> {
	try {
		const callbackResult = callback() as Data | Promise<Data>
		if (callbackResult instanceof Promise) {
			return callbackResult.then((data) => ({ data })).catch((error) => ({ error }))
		}
		return { data: callbackResult }
	} catch (e) {
		return { error: e }
	}
}
