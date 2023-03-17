import bodyParser from "body-parser"
import express from "express"
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import { getServerEnv } from "../../../src/env.js"
import { ENDPOINT } from "./generateConfigFile.js"

export const generateConfigFileRoute = express.Router()

const env = getServerEnv()
generateConfigFileRoute.use(bodyParser.json())

generateConfigFileRoute.post(ENDPOINT, async (req, res) => {
	try {
		const { messages } = req.body
		const response = await _queryChatGPT(messages)
		res.json(response)
	} catch (error) {
		res.status(500)
	}
})

const openapi = new OpenAIApi(
	new Configuration({
		apiKey: env.OPEN_AI_KEY,
	}),
)

/**
 * Extracted for testing purposes.
 */
export async function _queryChatGPT(messages: CreateChatCompletionRequest["messages"]) {
	const response = await openapi.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages,
	})
	return response.data
}
