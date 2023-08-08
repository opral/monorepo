import type { ErrorResult, Result, SuccessResult } from "./api.js"

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
): PromiseLike<Result<Data, unknown>> | Result<Data, unknown> {
	try {
		const callbackResult = callback() as Data | Promise<Data>
		if (callbackResult instanceof Promise) { // TODO: this is not the best way to check for a promise
			return callbackResult.then((data) => ({ data } as SuccessResult<Data>)).catch((error) => ({ error } as unknown as ErrorResult<unknown>))
		}
		return { data: callbackResult }
	} catch (e) {
		return { error: e }
	}
}
