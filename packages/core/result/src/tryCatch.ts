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
		if (isAsync(callbackResult)) {
			return callbackResult
				.then((data) => ({ data } as SuccessResult<Data>))
				.catch((error) => ({ error } as ErrorResult<unknown>))
		}
		return { data: callbackResult } as SuccessResult<Data>
	} catch (e) {
		return { error: e } as ErrorResult<unknown>
	}
}

const isAsync = <T>(p: unknown): p is Promise<T> =>
	!!p && typeof p === "object" && typeof (p as Promise<T>).then === "function"
