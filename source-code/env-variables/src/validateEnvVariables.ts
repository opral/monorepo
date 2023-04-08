import type { Result } from "@inlang/core/utilities"
import { z } from "zod"
import { privateEnvVariablesSchema, publicEnvVariablesSchema } from "../schema.js"

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
	const result = (
		args.forProduction
			? z.union([publicEnvVariablesSchema.required(), privateEnvVariablesSchema.required()])
			: z.union([publicEnvVariablesSchema, privateEnvVariablesSchema])
	).safeParse(process.env)
	if (result.success === false && result.error.issues[0].code === "invalid_union") {
		const errors = result.error.issues[0].unionErrors.flatMap((error) =>
			error.issues.map((issue) => ({
				key: issue.path[0] as string,
				errorMessage: issue.message,
			})),
		)
		return [undefined, errors]
	}
	return [true]
}
