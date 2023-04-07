import { z, type ZodType } from "zod"

export type PublicEnvVariables = {
	PUBLIC_POSTHOG_TOKEN: string
}

export type PrivateEnvVariabales = {
	OPEN_AI_KEY: string
	GOOGLE_TRANSLATE_API_KEY: string
}

export type AllEnvVariables = PublicEnvVariables & PrivateEnvVariabales

// all other exports are types. hence, this schema will be tree shaken if not imported
export const schema: ZodType<Required<AllEnvVariables>> = z.object({
	OPEN_AI_KEY: z.string(),
	PUBLIC_POSTHOG_TOKEN: z.string(),
	GOOGLE_TRANSLATE_API_KEY: z.string(),
})
