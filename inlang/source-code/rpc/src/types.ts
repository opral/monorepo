export type SuccessResult<Data> = { data: Data; error?: never }

export type ErrorResult<Error> = { data?: never; error: Error }

/**
 *
 * @deprecated Just use throwing. It's the standard API.
 *
 * A result represents an either success or an error, but never both.
 *
 * Do not use Result to represent both success and error at the same time
 * to not confuse the consumer of the result.
 *
 * @example
 *  function doSomething(): Result<string, Error> {
 *    return {
 *      error: "Something went wrong"
 *    }
 *  }
 *
 *  const result = doSomething()
 *  if (result.error) {
 *    console.log(result.error)
 *  }
 *
 */
// MOVED OUT OF @inlang/result because @inlang/result is going to be removed.
export type Result<Data, Error> = SuccessResult<Data> | ErrorResult<Error>
