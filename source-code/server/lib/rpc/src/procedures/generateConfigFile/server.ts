import { t } from "../../server.js"
import { z } from "zod"
import { Configuration, OpenAIApi } from "openai"
import { getServerEnv } from "#src/env.js"

export const generateConfigFile = t.procedure
	.input(
		// replicating the input type for chatgpt
		z.object({
			messages: z.array(
				z.object({
					role: z.union([z.literal("user"), z.literal("system"), z.literal("assistant")]),
					content: z.string(),
				}),
			),
		}),
	)
	.query(async (req) => {
		const response = await openapi.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: req.input.messages,
		})
		const configFile = response.data.choices.at(-1)!.message!.content
		return { configFile }
	})

const env = await getServerEnv()

const openapi = new OpenAIApi(
	new Configuration({
		organization: env.openAiOrganization,
		apiKey: env.openAiApiKey,
	}),
)
