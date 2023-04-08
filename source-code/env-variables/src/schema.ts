import { z } from "zod"

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
 */
export function validateEnvVariables(args: { forProduction: boolean }) {
	let result: z.SafeParseReturnType<any, any>
	// require all env variables in production
	if (args.forProduction) {
		result = z
			.union([publicEnvVariables.required(), privateEnvVariables.required()])
			.safeParse(process.env)
	} else {
		result = z.union([publicEnvVariables, privateEnvVariables]).safeParse(process.env)
	}
	if (result.success === false) {
		throw new Error(
			`Invalid environment variables\n\n${result.error.issues
				.map((issue) => issue.path + ": " + issue.message)
				.join("\n")}\n`,
		)
	}
}
