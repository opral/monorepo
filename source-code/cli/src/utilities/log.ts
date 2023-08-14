import consola, { Consola } from "consola"

/**
 * The logger that is used throughout the CLI.
 *
 * API -> https://www.npmjs.com/package/consola
 *
 * @example
 *   log.success("Success")
 */
export const log = consola as unknown as Consola
