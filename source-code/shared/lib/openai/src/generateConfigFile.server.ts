import { mockEnvironment, validateConfigFile } from "@inlang/core/test"
import { Result } from "@inlang/core/utilities"
import express from "express"
import { Volume } from "memfs"
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import { getServerEnv } from "../../../src/env.js"
import { ENDPOINT } from "./generateConfigFile.js"
import bodyParser from "body-parser"
import { z } from "zod"

export const generateConfigFileRoute = express.Router()
generateConfigFileRoute.use(bodyParser.json({ limit: "10mb" }))

const env = getServerEnv()

generateConfigFileRoute.post(ENDPOINT, async (req, res) => {
	try {
		const { filesystemAsJson } = z
			.object({ filesystemAsJson: z.record(z.string()) })
			.parse(req.body)
		const response = await _generateConfigFileServer({ filesystemAsJson })
		if (response.isErr) {
			console.log(response.error)
		}
		res.json(response)
	} catch (error) {
		res.status(500)
		res.send()
	}
})

const openapi = new OpenAIApi(
	new Configuration({
		apiKey: env.OPEN_AI_KEY,
	}),
)

/**
 * Internal wrapper to test the function without the requirement to run a server during testing.
 */
export async function _generateConfigFileServer(args: {
	filesystemAsJson: Record<string, string>
	// messages is required to recursively call the function
	// upon a failed config file generation
	messages?: CreateChatCompletionRequest["messages"]
}): Promise<Result<string, Error>> {
	const fs = Volume.fromJSON(args.filesystemAsJson, "/").promises
	const env = await mockEnvironment({ copyDirectory: { fs: fs, paths: ["/"] } })
	if (args.messages === undefined) {
		args.messages = [{ role: "system", content: prompt(Object.keys(args.filesystemAsJson)) }]
	} else if (args.messages.length > 6) {
		return Result.err(
			new Error("Couldn't generate a config file. " + args.messages.at(-1)!.content),
		)
	}
	try {
		const response = await openapi.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: args.messages,
		})
		const configFile = response.data.choices.at(-1)!.message!.content
		const isValidConfig = await validateConfigFile({ file: configFile, env })
		if (isValidConfig.isOk) {
			return Result.ok(configFile)
		}
		return _generateConfigFileServer({
			...args,
			messages: [
				...args.messages,
				response.data.choices.at(-1)!.message!,
				{
					role: "user",
					content:
						"The config does not work. Try again and only reply with the config. No explanations. " +
						isValidConfig.error.message,
				},
			],
		})
	} catch (error) {
		console.log(error)
		return Result.err(error as Error)
	}
}

/**
 * The prompt for the openai api.
 */
function prompt(filePaths: string[]): string {
	return `
  You are supposed to write a config file for a service called "inlang" that exports a defineConfig function. 

  Only reply with the code. Don't wrap the code in \`\`\`. Don't write explanations. 
  
  The repository for the config file has the following files:
  
  ${filePaths.join("\n")}
  
  export async function defineConfig(env) {
    // imports happen from jsdelivr with the following pattern:
    // https://cdn.jsdelivr.net/gh/{owner}/{repo}@{version}/{path}
    // recommended to use major version pinning @1 instead of @1.0.0
    const plugin = await env.$import(
      // for .json files
      // "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js"
      // for .po files
      // "https://cdn.jsdelivr.net/gh/jannesblobel/inlang-plugin-po@1/dist/index.js"
    );
  
    const pluginConfig = {
      pathPattern: "./locales/{language}.json",
    };
  
    return {
      referenceLanguage: "en",
      languages: await plugin.getLanguages({
        ...env,
        pluginConfig,
      }),
      readResources: (args) =>
        plugin.readResources({ ...args, ...env, pluginConfig }),
      writeResources: (args) =>
        plugin.writeResources({ ...args, ...env, pluginConfig }),
    };
  }  
`
}
