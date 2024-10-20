import type { Result } from "./api.js";

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
export function tryCatch<Data>(
  callback: () => Promise<Data>,
): Promise<Result<Data, Error>>;
export function tryCatch<Data>(callback: () => Data): Result<Data, Error>;
export function tryCatch<Data>(
  callback: () => Data | Promise<Data>,
): Promise<Result<Data, Error>> | Result<Data, Error> {
  try {
    const callbackResult = callback() as Data | Promise<Data>;
    if (isAsync(callbackResult)) {
      return callbackResult.then((data) => ({ data })).catch(getErrorResponse);
    }
    return { data: callbackResult };
  } catch (e) {
    return getErrorResponse(e);
  }
}

const getErrorResponse = (error: unknown) => {
  if (error instanceof Error) {
    return { error: error };
  }
  return {
    error: new Error(`Unknown error has been caught: ${error}`, {
      cause: error,
    }),
  };
};

const isAsync = <T>(p: unknown): p is Promise<T> =>
  !!p && typeof p === "object" && typeof (p as Promise<T>).then === "function";
