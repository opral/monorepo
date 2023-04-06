import type { ZodType } from "zod"

export const isDevelopment = process.env.DEV ? true : false

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

/**
 * Get the public environment variables.
 *
 * If you need to access environment variables that are
 * not supposed to be exposed to the client/browser,
 * use `getPrivateEnvVariables` instead.
 */
export const publicEnv = process.env as unknown as PublicEnvVariables

/**
 * Get the environment variables for the server.
 *
 * ! Do not use this function in code that is
 * ! supossed to be ran on the client/browser.
 */
export async function getPrivateEnvVariables() {
	const { config } = await import("dotenv")
	config()
	return process.env as unknown as AllEnvVariables
}

/**
 * Validate the environment variables.
 *
 * Use in the build step to ensure the environment variables are valid.
 * @throws {Error} If the environment variables are invalid.
 */
export async function validateEnvVariables() {
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
	const validator = isDevelopment ? devSchema : productionSchema
	const result = validator.safeParse(await getPrivateEnvVariables())
	if (!result.success) {
		throw new Error(
			`Invalid environment variables\n\n${result.error.issues
				.map((issue) => issue.path + ": " + issue.message)
				.join("\n")}\n`,
		)
	}
}
