import type { Result } from "@inlang/core/utilities"
import type { EnvironmentFunctions } from "@inlang/core/config"
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import { privateEnv } from "@inlang/env-variables"
import { telemetryNode } from "@inlang/telemetry"
import { Volume } from "memfs"
import { mockEnvironment, validateConfigFile } from "@inlang/core/test"
import dedent from "dedent"
import { prompt } from "./generateConfigFile.prompt.js"

/**
 * Generates a configuration file for inlang.
 *
 * @example
 * // generate a config file for the current directory
 * const [response, error] = await generateConfigFile({ fs: fs.promises, path: "./" })
 */
export async function generateConfigFile(args: {
	fs: EnvironmentFunctions["$fs"]
	path: string
}): Promise<
	Result<string, { chatGPTMessages?: CreateChatCompletionRequest["messages"]; message: string }>
> {
	try {
		const filesystemAsJson = await readdirRecursive(args)
		const [config, exception] = await _generateConfigFileRecursive({ filesystemAsJson })
		telemetryNode.capture({
			distinctId: "unknown",
			event: "config file generated",
			properties: {
				success: config ? true : false,
				message: exception?.message,
				chat: exception?.chatGPTMessages,
			},
		})
		return [config, exception] as any
	} catch (error) {
		return [undefined, error] as any
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
export async function _generateConfigFileRecursive(args: {
	filesystemAsJson: Record<string, string>
	// messages is required to recursively call the function
	// upon a failed config file generation
	messages?: CreateChatCompletionRequest["messages"]
}): ReturnType<typeof generateConfigFile> {
	const fs = Volume.fromJSON(args.filesystemAsJson).promises
	const env = await mockEnvironment({ copyDirectory: { fs: fs, paths: ["/"] } })
	if (args.messages === undefined) {
		const _prompt = prompt(Object.keys(args.filesystemAsJson))
		if (_prompt.length > 2000) {
			return [
				undefined,
				{
					message: dedent`
The current working directory contains too many file(paths).

Solution: Are you you in the root of your repository?

Explanation: The maximum prompt for the OpenAI API is 2000 characters. The current prompt is ${_prompt.length} characters.
			
			`,
				},
			]
		}
		args.messages = [{ role: "system", content: prompt(Object.keys(args.filesystemAsJson)) }]
	} else if (args.messages.length > 6) {
		return [
			undefined,
			{ message: "Coundn't generate the config file.", chatGPTMessages: args.messages },
		]
	}
	try {
		const response = await openapi.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: args.messages,
			// the lower the temperature, the more deterministic the output
			// the higher the temperature, the more random the output
			// for reproducibility, a lower temperature is better
			temperature: 0.2,
		})
		const configFile = response.data.choices.at(-1)!.message!.content
		const [, exception] = await validateConfigFile({ file: configFile, env })
		if (!exception) {
			return [configFile, undefined]
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
		})
	} catch (error) {
		return [undefined, { message: error!.toString() }]
	}
}

/**
 * Recursively reads the contents of a directory.
 */
async function readdirRecursive(args: {
	fs: EnvironmentFunctions["$fs"]
	path: string
}): Promise<Record<string, string>> {
	const { fs, path } = args
	let result: Record<string, string> = {}
	// Read the contents of the current directory
	const files = await fs.readdir(path)
	// Loop through each file/directory
	for (const file of files) {
		// Construct the full path to the file/directory
		const fullPath = normalizePath(`${path}/${file}`)
		// Check if the current item is a directory by trying to read it
		let isDirectory = false
		try {
			await fs.readFile(fullPath)
		} catch (error) {
			isDirectory = true
		}
		// don't include node_modules and dist folders as they are not source code
		if (
			fullPath.includes("node_modules") ||
			fullPath.includes("dist") ||
			fullPath.includes(".git") ||
			fullPath.includes(".Trash")
		) {
			continue
		} else if (isDirectory) {
			// If the item is a directory, recurse into it and add the results to the current list
			const subList = await readdirRecursive({ fs, path: fullPath })
			result = { ...result, ...subList }
		} else {
			const content = await fs.readFile(fullPath, { encoding: "utf-8" })
			result[fullPath] = content as string
		}
	}
	return result
}

/*
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
function normalizePath(path: string) {
	if (typeof path !== "string") {
		throw new TypeError("expected path to be a string")
	}

	if (path === "\\" || path === "/") return "/"

	const len = path.length
	if (len <= 1) return path

	// ensure that win32 namespaces has two leading slashes, so that the path is
	// handled properly by the win32 version of path.parse() after being normalized
	// https://msdn.microsoft.com/library/windows/desktop/aa365247(v=vs.85).aspx#namespaces
	let prefix = ""
	if (len > 4 && path[3] === "\\") {
		const ch = path[2]
		if ((ch === "?" || ch === ".") && path.slice(0, 2) === "\\\\") {
			path = path.slice(2)
			prefix = "//"
		}
	}
	const segs = path.split(/[/\\]+/)
	return prefix + segs.join("/")
}
