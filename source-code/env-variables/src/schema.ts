import { z } from "zod"
import type { Result } from "@inlang/core/utilities"

export type PublicEnvVariables = z.infer<typeof publicEnvVariables>

export type PrivateEnvVariables = z.infer<typeof privateEnvVariables>

export type AllEnvVariables = PublicEnvVariables & PrivateEnvVariables

const publicEnvVariables = z.object({
	PUBLIC_GITHUB_APP_CLIENT_ID: z.string(),
	PUBLIC_GIT_PROXY_URI: z.string(),
	PUBLIC_SENTRY_DSN_CLIENT: z.string().optional(),
	PUBLIC_POSTHOG_TOKEN: z.string().optional(),
})

const privateEnvVariables = z.object({
	SESSION_COOKIE_SECRET: z.string(),
	JWE_SECRET: z.string(),
	OPEN_AI_KEY: z.string().optional(),
	GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
	SENTRY_DSN_SERVER: z.string().optional(),
})

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
			? z.union([publicEnvVariables.required(), privateEnvVariables.required()])
			: z.union([publicEnvVariables, privateEnvVariables])
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
