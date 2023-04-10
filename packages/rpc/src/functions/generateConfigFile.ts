import type { Result } from "@inlang/core/utilities"
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import { privateEnv } from "@inlang/env-variables"
import { telemetryNode } from "@inlang/telemetry"
import { Volume } from "memfs"
import { mockEnvironment, validateConfigFile } from "@inlang/core/test"
import dedent from "dedent"
import { prompt, promptVersion } from "./generateConfigFile.prompt.js"

export async function generateConfigFileServer(args: {
	filesystemAsJson: Record<string, string>
}): Promise<Result<string, { errorMessage: string }>> {
	try {
		const [success, exception] = await _generateConfigFileRecursive(args)
		telemetryNode.capture({
			distinctId: "unknown",
			event: "config file generated",
			properties: {
				success: success ? true : false,
				promptVersion: promptVersion,
				iteration: success?.iteration ?? exception?.iteration,
				chatHistory: success?.chatHistory ?? exception?.chatHistory,
			},
		})
		if (exception) {
			return [undefined, { errorMessage: exception.errorMessage }]
		}
		return [success.configFile]
	} catch (error) {
		return [undefined, { errorMessage: (error as Error)?.message }]
	}
}

const openapi = new OpenAIApi(
	new Configuration({
		apiKey: privateEnv.OPEN_AI_KEY,
	}),
)

/**
 * Internal wrapper to test the function without the requirement to run a server during testing.
 */
async function _generateConfigFileRecursive(args: {
	filesystemAsJson: Record<string, string>
	// messages is required to recursively call the function
	// upon a failed config file generation
	messages?: CreateChatCompletionRequest["messages"]
	iteration?: number
}): Promise<
	Result<
		{ chatHistory: CreateChatCompletionRequest["messages"]; configFile: string; iteration: number },
		{
			chatHistory?: CreateChatCompletionRequest["messages"]
			iteration: number
			errorMessage: string
		}
	>
> {
	const iteration = args.iteration ?? 0
	const fs = Volume.fromJSON(args.filesystemAsJson).promises
	const env = await mockEnvironment({ copyDirectory: { fs: fs, paths: ["/"] } })
	if (args.messages === undefined) {
		const _prompt = prompt(Object.keys(args.filesystemAsJson))
		if (_prompt.length > 2000) {
			return [
				undefined,
				{
					iteration,
					errorMessage: dedent`
The current working directory contains too many file(paths).

Solution: Are you you in the root of your repository?

Explanation: The maximum prompt for the OpenAI API is 2000 characters. The current prompt is ${_prompt.length} characters.
			
			`,
				},
			]
		}
		args.messages = [{ role: "system", content: prompt(Object.keys(args.filesystemAsJson)) }]
	} else if (iteration > 3) {
		return [
			undefined,
			{
				chatHistory: args.messages,
				iteration,
				errorMessage: "Couldn't generate config file after 3 iterations.",
			},
		]
	}
	try {
		const response = await openapi.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: args.messages,
			// the lower the temperature, the more deterministic the output
			// the higher the temperature, the more random the output
			// for reproducibility
			temperature: 0.7,
		})
		const configFile = response.data.choices.at(-1)!.message!.content
		const [, exception] = await validateConfigFile({ file: configFile, env })
		if (!exception) {
			return [
				{ configFile, iteration, chatHistory: response.data.choices.map((c) => c.message!) },
				undefined,
			]
		}
		return _generateConfigFileRecursive({
			...args,
			messages: [
				...args.messages,
				response.data.choices.at(-1)!.message!,
				{
					role: "user",
					content:
						"The config does not work. Try again and only reply with the config. No explanations. " +
						exception.message,
				},
			],
			iteration: iteration + 1,
		})
	} catch (error) {
		return [undefined, { iteration, errorMessage: error!.toString() }]
	}
}
