import { Volume } from "memfs"
import { describe, expect, it } from "vitest"
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import { mockEnvironment, validateConfigFile } from "@inlang/core/test"
import type { EnvironmentFunctions } from "@inlang/core/config"
import { Result } from "@inlang/core/utilities"

const openapi = new OpenAIApi(
	new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	}),
)

// skipping tests due to costs of invoking the openai api
describe("generating config files", () => {
	it(
		"should generate a config file for a simple json project",
		async () => {
			const fs = Volume.fromJSON({
				"locales/en.json": JSON.stringify({ hello: "hello from en" }),
				"locales/fr.json": JSON.stringify({ hello: "bonjour via fr" }),
				"locales/de.json": JSON.stringify({ hello: "hallo von de" }),
				"locales/utils.js": JSON.stringify("jibberish"),
				"main.js": "export function hello() { return 'hello' }",
			})
			const env = await mockEnvironment({ copyDirectory: { fs: fs.promises, path: "/" } })
			const result = await generateConfigFile(env)
			if (result.isErr) {
				console.log(result.error)
			}
			expect(result.isOk).toBe(true)
		},
		{ timeout: 50000 },
	)

	it(
		"should generate a config file for a complex json project",
		async () => {
			const fs = Volume.fromJSON({
				"i18n/en/base.json": JSON.stringify({ hello: "hello from en" }),
				"i18n/fr/base.json": JSON.stringify({ hello: "hello from fr" }),
				"i18n/de/base.json": JSON.stringify({ hello: "hello from de" }),
				"i18n/utils.js": JSON.stringify("jibberish"),
				"package.json": "{}",
				"src/entry.js": "export function hello() { return 'hello' }",
				"main.js": "export function hello() { return 'hello' }",
			})
			const env = await mockEnvironment({ copyDirectory: { fs: fs.promises, path: "/" } })
			const result = await generateConfigFile(env)
			if (result.isErr) {
				console.log(result.error)
			}
			expect(result.isOk).toBe(true)
		},
		{ timeout: 50000 },
	)
})

async function generateConfigFile(
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
		const response = await openapi.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages,
		})
		const configFile = response.data.choices.at(-1)!.message!.content
		const isValidConfig = await validateConfigFile({ file: configFile, env })
		if (isValidConfig.isOk) {
			return Result.ok(configFile)
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

async function readdirRecursive(args: { fs: EnvironmentFunctions["$fs"]; path: string }) {
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
