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
 * Get server side env variables.
 *
 * @example
 * 	 const env = serverSideEnv();
 */
export function getServerEnv(): ServerSideEnv {
	dotenv.config()
	return envSchema.parse(process.env)
}

const envSchema = z.object({
	// optional to allow for local development
	OPEN_AI_KEY: z.string().optional().describe("The OpenAI API key."),
})

// validate the env variables on startup
envSchema.parse(getServerEnv())
