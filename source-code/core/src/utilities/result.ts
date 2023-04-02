// eslint-disable-next-line @typescript-eslint/ban-types
export type NonNullish = Exclude<{}, null>

export type SuccessResult<Data> = Data extends void | undefined ? never : [Data, undefined?]

export type ExceptionResult<Exception> = [undefined, Exception]

export type Result<Data extends NonNullish, Exception extends NonNullish> =
	| SuccessResult<Data>
	| ExceptionResult<Exception>
