/**
 * Define the public environment variables.
 *
 * Use in the build step to define the public environment variables.
 * ! Never use this function outside of a build step to avoid exposing
 * ! private environment variables to the client/browser.
 */
export function buildTimeVariables() {
	const publicEnv: Record<string, string> = {
		PUBLIC_IS_DEV: process.env.DEV ? "true" : "false",
	}
	for (const key in process.env) {
		if (key.startsWith("PUBLIC_")) {
			publicEnv[key] = process.env[key]!
		}
	}
	return {
		PUBLIC_ENV_DEFINED_IN_BUILD_STEP: JSON.stringify(publicEnv),
	}
}
