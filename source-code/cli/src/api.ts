/**
 * APIs that can be used throughout the CLI.
 */

import prompts from "prompts"
import consola, { Consola } from "consola"

/**
 * The prompts that are used throughout the CLI.
 *
 * API -> https://www.npmjs.com/package/prompts
 *
 * @example
 *  const response = await prompt({
 */
export const prompt = prompts

/**
 * The logger that is used throughout the CLI.
 *
 * API -> https://www.npmjs.com/package/consola
 *
 * @example
 *   log.success("Success")
 */
export const logger = consola as unknown as Consola
