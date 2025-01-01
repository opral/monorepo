import consola from "consola";

/**
 * The logger that is used throughout the CLI.
 *
 * API -> https://www.npmjs.com/package/consola
 *
 * @example
 *   log.success("Success")
 */
export const log = consola;

export function logError(error: any) {
  log.error(causeString(error), error);
}

// Convert error.cause into a string for logging
export function causeString(error: any) {
  if (typeof error === "object" && error.cause) {
    if (error.cause.errors?.length) return error.cause.errors.join(", ");
    if (error.cause.code) return "" + error.cause.code;
    return JSON.stringify(error.cause);
  }
  return "";
}
