import { config } from "dotenv"
import type { AllEnvVariables } from "../schema.js"

/**
 * PRIVATE environment variables.
 *
 * Use only in a server environment. Do not expose to the client/browser.
 * Use `publicEnv` instead for public environment variables.
 */
export const privateEnv: AllEnvVariables = withValidationProxy(getPrivateEnvVariables())

function withValidationProxy(env: AllEnvVariables) {
	return new Proxy(env, {
		get(target, prop) {
			if (prop in target) {
				return target[prop as keyof AllEnvVariables]
			} else if (typeof prop === "string" && process.env._VALIDATING_ENV_VARIABLES !== "true") {
				throw new Error(`Missing environment variable '${String(prop)}'`)
			}
		},
	})
}

function getPrivateEnvVariables() {
	const rootEnvFilePath = new URL("../../../.env", import.meta.url).pathname
	const result = config({ path: rootEnvFilePath })
	if (result.error) {
		return process.env as unknown as AllEnvVariables
	}
	return result.parsed as unknown as AllEnvVariables
}
