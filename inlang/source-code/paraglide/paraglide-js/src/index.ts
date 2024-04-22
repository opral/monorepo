export { compile } from "./compiler/compile.js"
export { writeOutput } from "./services/file-handling/write-output.js"
export { Logger, type LoggerOptions } from "./services/logger/index.js"

export type MessageIndexFunction<T extends string> = (
	params: Record<string, never>,
	options: { languageTag: T }
) => string

export type MessageFunction = (params?: Record<string, never>) => string
