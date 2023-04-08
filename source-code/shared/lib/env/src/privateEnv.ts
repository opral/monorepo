import type { AllEnvVariables } from "./schema.js"
import { config } from "dotenv"

/**
 * PRIVATE environment variables.
 *
 * Use only in a server environment. Do not expose to the client/browser.
 * Use `publicEnv` instead for public environment variables.
 */
export const privateEnv: AllEnvVariables = withValidationProxy(getPrivateEnvVariables())

function getPrivateEnvVariables() {
	const result = config()
	if (result.error) {
		return process.env as unknown as AllEnvVariables
	}
	return { ...process.env, ...result.parsed } as unknown as AllEnvVariables
}

function withValidationProxy(env: AllEnvVariables) {
	return new Proxy(env, {
		get(target, prop) {
			if (prop in target) {
				return target[prop as keyof AllEnvVariables]
			} else {
				throw new Error(`Missing environment variable '${String(prop)}'`)
			}
		},
	})
}
