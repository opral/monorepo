import type { Result } from "@inlang/core/utilities"
import { privateEnvVariablesSchema, publicEnvVariablesSchema } from "./schema.js"

/**
 * Validates the environment variables.
 *
 * Call this function in the entry point of the application
 * (usually the server).
 *
 */
export function validateEnvVariables(args: {
	forProduction: boolean
}): Result<true, Array<{ key: string; errorMessage: string }>> {
	// require all env variables in production
	const schema = args.forProduction
		? privateEnvVariablesSchema.merge(publicEnvVariablesSchema).required()
		: privateEnvVariablesSchema.merge(publicEnvVariablesSchema)
	const result = schema.safeParse(process.env)
	if (result.success === false) {
		const errors = result.error.issues.map((issue) => ({
			key: issue.path[0] as string,
			errorMessage: issue.message,
		}))
		return [undefined, errors]
	}
	return [true]
}
