import { z } from "zod"

export type PublicEnvVariables = z.infer<typeof publicEnvVariablesSchema>

export type PrivateEnvVariables = z.infer<typeof privateEnvVariablesSchema>

export type AllEnvVariables = PublicEnvVariables & PrivateEnvVariables

export const publicEnvVariablesSchema = z.object({
	PUBLIC_LIX_GITHUB_APP_CLIENT_ID: z.string(),
	PUBLIC_LIX_GITHUB_APP_NAME: z.string(),
	PUBLIC_GIT_PROXY_BASE_URL: z
		.string()
		.startsWith("http")
		.regex(/^(?!.*\/$).+$/, "Must not end with a slash")
		.describe(`Must be a url including protocol`),
	PUBLIC_WEBSITE_SENTRY_DSN: z.string().optional().describe("DSN for Sentry (in the browser)"),
	PUBLIC_FINK_SENTRY_DSN: z.string().optional().describe("DSN for Sentry (in the fink)"),
	PUBLIC_POSTHOG_TOKEN: z.string().optional(),
	PUBLIC_POSTHOG_PROJECT_ID: z.string(),
	PUBLIC_SERVER_BASE_URL: z
		.string()
		.url()
		.regex(/^(?!.*\/$).+$/, "Must not end with a slash")
		.describe("The base url of the server e.g. https://inlang.com"),
	PUBLIC_ALLOWED_AUTH_URLS: z
		.string()
		.describe("List of allowed base urls eg https://inlang.com,https://manage.inlang.com"),
	PUBLIC_HCAPTCHA_SITEKEY: z.string().describe("The sitekey to https://www.hcaptcha.com/"),
})
export const privateEnvVariablesSchema = z.object({
	LIX_GITHUB_APP_CLIENT_SECRET: z.string(),
	SESSION_COOKIE_SECRET: z.string(),
	JWE_SECRET: z.string(),
	OPEN_AI_KEY: z.string().optional(),
	GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
	SERVER_SENTRY_DSN: z.string().optional().describe("DSN for Sentry (on the server)"),
	ALGOLIA_ADMIN: z.string(),
	ALGOLIA_APPLICATION: z.string(),
	POSTHOG_API_KEY: z.string(),
	// prefixed with INLANG_ because github doesn't allow env vars with GITHUB_ in ci/cd.
})
