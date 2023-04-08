import { config } from "dotenv"
import type { AllEnvVariables } from "../../schema.js"

/**
 * PRIVATE environment variables.
 *
 * Use only in a server environment. Do not expose to the client/browser.
 * Use `publicEnv` instead for public environment variables.
 */
export const privateEnv: AllEnvVariables = getPrivateEnvVariables()

function getPrivateEnvVariables() {
	// @ts-expect-error - ROOT_ENV_FILE_PATH is defined in build step
	const result = config({ path: ROOT_ENV_FILE_PATH })
	if (result.error) {
		return process.env as unknown as AllEnvVariables
	}
	return { ...process.env, ...result.parsed } as unknown as AllEnvVariables
}
