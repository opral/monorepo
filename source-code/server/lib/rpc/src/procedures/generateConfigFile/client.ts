import type { EnvironmentFunctions } from "@inlang/core/config"
import type { FS } from "@inlang/core/fs"
import type { CreateChatCompletionRequest } from "openai"
import { Result } from "@inlang/core/utilities"
import { t } from "../../server.js"
import { rpc } from "../../client.js"
import { validateConfigFile } from "@inlang/core/test"

export async function generateConfigFile(
	env: EnvironmentFunctions,
	messages?: CreateChatCompletionRequest["messages"],
): Promise<Result<string, Error>> {
	if (messages === undefined) {
		// initial prompt
		const files = await readdirRecursive({ fs: env.$fs, path: "./" })
		messages = [{ role: "system", content: prompt(files) }]
	} else if (messages.length > 6) {
		// abort if tried too many times to save costs
		console.log({ messages })
		return Result.err(new Error("Couldn't generate a config file."))
	}
	try {
		const response = await rpc.generateConfigFile.query({ messages })
		const isValidConfig = await validateConfigFile({ file: response.configFile, env })
		if (isValidConfig.isOk) {
			return Result.ok(response.configFile)
		}
		return generateConfigFile(env, [
			...messages,
			response.data.choices.at(-1)!.message!,
			{
				role: "user",
				content:
					"The config does not work. Try again and only reply with the config. No explanations. " +
					isValidConfig.error.message,
			},
		])
	} catch (error) {
		return Result.err(error as Error)
	}
}

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
export function normalizePath(path: string) {
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
