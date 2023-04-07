import type { PublicEnvVariables } from "./schema.js"

/**
 * PUBLIC environment variables.
 *
 * If you need to access environment variables that are
 * not supposed to be exposed to the client/browser,
 * use `privateEnv` instead.
 */
export const publicEnv: PublicEnvVariables = withValidationProxy(
	// @ts-expect-error - ENV_DEFINED_IN_BUILD_STEP is defined in build step
	typeof ENV_DEFINED_IN_BUILD_STEP !== "undefined"
		? // @ts-expect-error - ENV_DEFINED_IN_BUILD_STEP is defined in build step
		  ENV_DEFINED_IN_BUILD_STEP
		: // must be defined to avoid errors with the validation proxy
		  { PUBLIC_IS_DEV: "true" },
)

/**
 * Is the application running in development mode?
 *
 * Note that this variable is defined in the dev/build step
 * of @inlang/shared and might not reflect the actual environment
 * if you are using @inlang/shared in a different module.
 */
// @ts-expect-error - DEV is defined in build step
export const isDevelopment = publicEnv.PUBLIC_IS_DEV ? true : false

function withValidationProxy(env: PublicEnvVariables) {
	return new Proxy(env, {
		get(target, prop) {
			if (typeof prop === "string" && prop.startsWith("PUBLIC_") === false) {
				throw new Error("Public env variables must start with PUBLIC_")
			} else if (prop in target) {
				return target[prop as keyof PublicEnvVariables]
			} else {
				throw new Error(`Missing environment variable '${String(prop)}'`)
			}
		},
	})
}
