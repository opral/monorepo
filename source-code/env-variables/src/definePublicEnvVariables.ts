/**
 * Define the public environment variables.
 *
 * Use in the build step to define the public environment variables.
 * ! Never use this function outside of a build step to avoid exposing
 * ! private environment variables to the client/browser.
 */
export function definePublicEnvVariables(env: Record<string, string>) {
	const result: Record<string, string> = {}
	for (const key in env) {
		if (key.startsWith("PUBLIC_")) {
			result[key] = env[key]!
		}
	}
	return { ENV_DEFINED_IN_BUILD_STEP: JSON.stringify(result) }
}
