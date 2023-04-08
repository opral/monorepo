import type { PublicEnvVariables } from "../../schema.js"

/**
 * PUBLIC environment variables.
 *
 * If you need to access environment variables that are
 * not supposed to be exposed to the client/browser,
 * use `privateEnv` instead.
 */
export const publicEnv: PublicEnvVariables = withValidationProxy(
	// @ts-expect-error - ENV_DEFINED_IN_BUILD_STEP is defined in build step
	typeof PUBLIC_ENV_DEFINED_IN_BUILD_STEP !== "undefined" ? PUBLIC_ENV_DEFINED_IN_BUILD_STEP : {},
)

function withValidationProxy(env: PublicEnvVariables) {
	return new Proxy(env, {
		get(target, prop) {
			if (typeof prop === "string" && prop.startsWith("PUBLIC_") === false) {
				throw new Error("Public env variables must start with PUBLIC_")
			} else if (prop in target) {
				return target[prop as keyof PublicEnvVariables]
			}
		},
	})
}
