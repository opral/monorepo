import { z } from "zod"

export type PublicEnvVariables = z.infer<typeof publicEnvVariablesSchema>

export type PrivateEnvVariables = z.infer<typeof privateEnvVariablesSchema>

export type AllEnvVariables = PublicEnvVariables & PrivateEnvVariables

export const publicEnvVariablesSchema = z.object({
	PUBLIC_GITHUB_APP_CLIENT_ID: z.string(),
	PUBLIC_GIT_PROXY_URI: z.string(),
	PUBLIC_SENTRY_DSN_CLIENT: z.string().optional(),
	PUBLIC_POSTHOG_TOKEN: z.string().optional(),
})

export const privateEnvVariablesSchema = z.object({
	SESSION_COOKIE_SECRET: z.string(),
	JWE_SECRET: z.string(),
	OPEN_AI_KEY: z.string().optional(),
	GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
	SENTRY_DSN_SERVER: z.string().optional(),
})
