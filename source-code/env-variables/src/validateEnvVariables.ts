import { schema } from "./schema.js"

/**
 * Validate the environment variables.
 *
 * Use in the build step to ensure the environment variables are valid.
 * @throws {Error} If the environment variables are invalid.
 */
export async function validateEnvVariables() {
	const env = {}
	const result = schema.safeParse(env)
	if (!result.success) {
		throw new Error(
			`Invalid environment variables\n\n${result.error.issues
				.map((issue) => issue.path + ": " + issue.message)
				.join("\n")}\n`,
		)
	}
}
