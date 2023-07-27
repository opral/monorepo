// eslint-disable-next-line @typescript-eslint/ban-types
type NonNullish = Exclude<{}, null>

type SuccessResult<Data> = Data extends void | undefined ? never : [Data, undefined?]

type ExceptionResult<Exception> = [undefined, Exception]

export type Result<Data extends NonNullish, Exception extends NonNullish> =
	| SuccessResult<Data>
	| ExceptionResult<Exception>
