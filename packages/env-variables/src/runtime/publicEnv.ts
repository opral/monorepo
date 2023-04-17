import type { PublicEnvVariables } from "../schema.js"

/**
 * PUBLIC environment variables.
 *
 * If you need to access environment variables that are
 * not supposed to be exposed to the client/browser,
 * use `privateEnv` instead.
 */
export const publicEnv: PublicEnvVariables = new Proxy({} as PublicEnvVariables, {
	get(target, prop) {
		if (typeof prop === "string" && prop.startsWith("PUBLIC_") === false) {
			throw new Error("Public env variables must start with PUBLIC_")
		} else if (typeof process !== "undefined" && process?.env[prop as string]) {
			return process.env[prop as string]
		} else if (
			// @ts-expect-error - ENV_DEFINED_IN_BUILD_STEP is defined in build step
			typeof PUBLIC_ENV_DEFINED_IN_BUILD_STEP !== "undefined" &&
			// @ts-expect-error - ENV_DEFINED_IN_BUILD_STEP is defined in build step
			PUBLIC_ENV_DEFINED_IN_BUILD_STEP[prop as string]
		) {
			// @ts-expect-error - ENV_DEFINED_IN_BUILD_STEP is defined in build step
			return PUBLIC_ENV_DEFINED_IN_BUILD_STEP[prop as string]
		}
		return (target as any)[prop]
	},
})
