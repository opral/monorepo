import { generateConfigFile } from "./generateConfigFile/server.js"

/**
 * All procedures in the API.
 *
 * The procedures are bundled into a single object and
 * consumed by the trpc router in ../main.js.
 */
export const procedures = {
	generateConfigFile,
}
