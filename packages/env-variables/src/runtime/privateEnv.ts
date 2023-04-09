import { config } from "dotenv"
import type { AllEnvVariables } from "../schema.js"

/**
 * PRIVATE environment variables.
 *
 * Use only in a server environment. Do not expose to the client/browser.
 * Use `publicEnv` instead for public environment variables.
 */
export const privateEnv: AllEnvVariables = getPrivateEnvVariables()

function getPrivateEnvVariables(): AllEnvVariables {
	if (typeof process === "undefined") {
		// mock privateEnv for the browser (if import is not tree-shaken)
		return new Proxy(
			{},
			{
				get: () => {
					throw Error(
						"`process.env` is undefined. You are accessing private env variables in a non-node environment, likely the browser. Private env variables should never be exposed to the client. Use `publicEnv` instead.",
					)
				},
			},
		) as unknown as AllEnvVariables
	}
	// @ts-expect-error - ROOT_ENV_FILE_PATH is defined in build step
	const result = config({ path: ROOT_ENV_FILE_PATH })
	// file does not exist, return process.env that likely defines all variables
	if (result.error) {
		return process.env as unknown as AllEnvVariables
	}
	return { ...process.env, ...result.parsed } as unknown as AllEnvVariables
}
