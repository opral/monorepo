export { compileProject as compile } from "./compiler/compileProject.js";
export { writeOutput } from "./services/file-handling/write-output.js";
export { Logger, type LoggerOptions } from "./services/logger/index.js";
export { classifyProjectErrors } from "./services/error-handling.js";

export type MessageIndexFunction<T extends string> = (
	params: Record<string, never>,
	options: { languageTag: T }
) => string;

export type MessageFunction = (params?: Record<string, never>) => string;
