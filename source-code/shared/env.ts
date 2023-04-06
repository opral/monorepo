import type { ZodType } from "zod"

/**
 * Must start with `PUBLIC_`.
 */
type PublicEnvVariables = {
	PUBLIC_POSTHOG_TOKEN?: string
}

type PrivateEnvVariabales = {
	OPEN_AI_KEY?: string
}

/**
 * All environment variables.
 *
 * Some might be undefined if they are not set in development.
 */
type AllEnvVariables = PublicEnvVariables & PrivateEnvVariabales

export const isDevelopment = process.env.DEV ? true : false

/**
 * Get the public environment variables.
 *
 * If you need to access environment variables that are
 * not supposed to be exposed to the client/browser,
 * use `getPrivateEnvVariables` instead.
 */
// process.env is replaced on build with public env variables
export const publicEnv = process.env as PublicEnvVariables

/**
 * Get the environment variables for the server.
 *
 * ! Do not use this function in code that is
 * ! supossed to be ran on the client/browser.
 */
export async function getPrivateEnvVariables() {
	const { config } = await import("dotenv")
	const result = config()
	console.log("env result", result)
	return result.parsed as unknown as AllEnvVariables
}

/**
 * Validate the environment variables.
 *
 * ! CURRENTLY NOT USED.
 * ! Validating the env variables requires the build command to have
 * ! all env variables set. This is not possible for external contributors.
 *
 * Use in the build step to ensure the environment variables are valid.
 * @throws {Error} If the environment variables are invalid.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateEnvVariables() {
	// ---------------- IMPORTS ----------------
	const { z } = await import("zod")
	// ---------------- SCHEMAS ----------------
	// different schemas for development and production
	// to ease contributions for external contributors
	const devSchema: ZodType<AllEnvVariables> = z.object({})
	// production must have all variables
	const productionSchema: ZodType<Required<AllEnvVariables>> = z.object({
		OPEN_AI_KEY: z.string(),
		PUBLIC_POSTHOG_TOKEN: z.string(),
	})
	// ---------------- VALIDATION ----------------
	const env = await getPrivateEnvVariables()
	const validator = isDevelopment ? devSchema : productionSchema
	const result = validator.safeParse(env)
	if (!result.success) {
		throw new Error(
			`Invalid environment variables\n\n${result.error.issues
				.map((issue) => issue.path + ": " + issue.message)
				.join("\n")}\n`,
		)
	}
}

/**
 * Define the public environment variables.
 *
 * Use in the build step to define the public environment variables.
 * ! Never use this function outside of a build step to avoid exposing
 * ! private environment variables to the client/browser.
 */
export async function definePublicEnvVariables(env: AllEnvVariables) {
	const result: Record<string, string> = {
		DEV: process.env.DEV ? "true" : "false",
	}
	for (const key in env) {
		if (key.startsWith("PUBLIC_")) {
			result[key] = env[key as keyof AllEnvVariables]!
		}
	}
	return { "process.env": JSON.stringify(result) }
}
