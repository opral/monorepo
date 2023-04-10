import { z } from "zod"

export type PublicEnvVariables = z.infer<typeof publicEnvVariablesSchema>

export type PrivateEnvVariables = z.infer<typeof privateEnvVariablesSchema>

export type AllEnvVariables = PublicEnvVariables & PrivateEnvVariables

export const publicEnvVariablesSchema = z.object({
	PUBLIC_GITHUB_APP_CLIENT_ID: z.string(),
	PUBLIC_GIT_PROXY_PATH: z
		.string()
		.startsWith("/")
		.endsWith("/")
		.describe(`Must be a path like /git-proxy/`),
	PUBLIC_WEBSITE_SENTRY_DSN: z.string().optional().describe("DSN for Sentry (in the browser)"),
	PUBLIC_POSTHOG_TOKEN: z.string().optional(),
	PUBLIC_SERVER_BASE_URL: z
		.string()
		.url()
		.regex(/^(?!.*\/$).+$/, "Must not end with a slash")
		.describe("The base url of the server e.g. https://inlang.com"),
})

export const privateEnvVariablesSchema = z.object({
	SESSION_COOKIE_SECRET: z.string(),
	JWE_SECRET: z.string(),
	OPEN_AI_KEY: z.string().optional(),
	GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
	SERVER_SENTRY_DSN: z.string().optional().describe("DSN for Sentry (on the server)"),
	GITHUB_APP_CLIENT_SECRET: z.string(),
})
