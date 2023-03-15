/**
 * --------------------------------
 * Env file and variables related code.
 *
 * Create an `.env` file that contains the variables
 * defined in the schemas below.
 * --------------------------------
 */

import dotenv from "dotenv"
import { z } from "zod"

export type ServerSideEnv = z.infer<typeof envSchema>

/**
 * The flag is set in the package.json scripts
 * via `NODE_ENV=production <command>`
 */
export const isProduction = process.env.NODE_ENV === "production"

/**
 * Get server side env variables.
 *
 * @example
 * 	 const env = serverSideEnv();
 */
export async function getServerEnv(): Promise<ServerSideEnv> {
	dotenv.config()
	return process.env as ServerSideEnv
}

const envSchema = z.object({
	openAiOrganization: z.string().optional().describe(`The OpenAI organization name`),
	openAiApiKey: z.string().optional().describe("The OpenAI API key."),
})

// Validating the env variables
// upon loading of this file.
const env = await getServerEnv()
envSchema.parse(env)
