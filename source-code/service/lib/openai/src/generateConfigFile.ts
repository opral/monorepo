import type { EnvironmentFunctions } from "@inlang/core/config"
import type { CreateChatCompletionRequest, CreateChatCompletionResponse } from "openai"
import { Result } from "@inlang/core/utilities"
import { validateConfigFile } from "@inlang/core/test"
import type { FS } from "@inlang/core/fs"

/**
 * The endpoint for the api call shared with the .server.ts file.
 */
export const ENDPOINT = "/services/openai/generate-config-file"

/**
 * Generates a configuration file for inlang.
 *
 * @example
 *   const result = await generateConfigFile(env)
 */
export function generateConfigFile(env: EnvironmentFunctions) {
	// wrapper function to inject the queryChatGpt function
	return _generateConfigFile({
		env,
		queryChatGpt: async (messages: CreateChatCompletionRequest["messages"]) => {
			const response = await fetch(
				process.env.NODE_ENV === "production"
					? "https://inlang.com"
					: "http://localhost:3000" + ENDPOINT,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(messages),
				},
			)
			const data = await response.json()
			return data
		},
	})
}

/**
 * Internal wrapper to test the function without the api call.
 */
export async function _generateConfigFile(args: {
	env: EnvironmentFunctions
	// messages is required to recursively call the function
	// upon a failed config file generation
	messages?: CreateChatCompletionRequest["messages"]
	/**
	 * Replaces the default queryChatGpt function with a custom one.
	 */
	queryChatGpt: (
		messages: CreateChatCompletionRequest["messages"],
	) => Promise<CreateChatCompletionResponse>
}): Promise<Result<string, Error>> {
	if (args.messages === undefined) {
		const files = await readdirRecursive({ fs: args.env.$fs, path: "./" })
		args.messages = [{ role: "system", content: prompt(files) }]
	} else if (args.messages.length > 6) {
		return Result.err(new Error("Couldn't generate a config file."))
	}
	try {
		const response = await args.queryChatGpt(args.messages)
		const configFile = response.choices.at(-1)!.message!.content
		const isValidConfig = await validateConfigFile({ file: configFile, env: args.env })
		if (isValidConfig.isOk) {
			return Result.ok(configFile)
		}
		return _generateConfigFile({
			...args,
			messages: [
				...args.messages,
				response.choices.at(-1)!.message!,
				{
					role: "user",
					content:
						"The config does not work. Try again and only reply with the config. No explanations. " +
						isValidConfig.error.message,
				},
			],
		})
	} catch (error) {
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

/**
 * Recursively reads the contents of a directory.
 */
async function readdirRecursive(args: { fs: FS; path: string }) {
	const { fs, path } = args
	let result: string[] = []
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
		if (isDirectory) {
			// If the item is a directory, recurse into it and add the results to the current list
			const subList = await readdirRecursive({ fs, path: fullPath })
			result = [...result, ...subList]
		} else {
			// If the item is a file, add it to the list
			// const content = await fs.readFile(fullPath, { encoding: "utf-8" })
			result.push(fullPath)
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
