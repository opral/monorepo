export type SuccessResult<Data> = { data: Data; error?: never }

export type ErrorResult<Error> = { data?: never; error: Error }

export type Result<Data, Error> = SuccessResult<Data> | ErrorResult<Error>
