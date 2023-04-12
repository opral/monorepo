import satori from "satori"
import { html } from "satori-html"
import { readFileSync } from "node:fs"
import clone from "./repo/clone.js"
import git from "isomorphic-git"
import fs from "./repo/fs.js"
import { mockEnvironment, validateConfigFile } from "@inlang/core/test"
import { Config, EnvironmentFunctions, initialize$import } from "@inlang/core/config"

// // const markup = (url: string) => html`<div style="color: black;">${url}</div>`
// const markup = html`<div
// 	style="display: flex; background-color: navy; height: 300px; width: 300px"
// ></div>`
// // See https://github.com/vercel/satori#documentation

// const font = readFileSync(new URL("./assets/static/Inter-Medium.ttf", import.meta.url))

export const badge = async (url: string) => {
	// Cloning the repository
	await clone(url)

	// Listing files
	const files = await git.listFiles({ fs, dir: "/", ref: "HEAD" })
	console.log(files)

	// Get the content of the inlang.config.js file
	const file = await fs.promises.readFile("inlang.config.js", "utf-8")
	const withMimeType = "data:application/javascript;base64," + btoa(file.toString())

	// Import the file
	const module = await import(/* @vite-ignore */ withMimeType)

	// Set up the environment functions
	const environmentFunctions: EnvironmentFunctions = {
		$import: initialize$import({
			fs: fs.promises,
			fetch,
		}),
		$fs: fs.promises,
	}

	// Execute the config file
	const config: Config = await module.defineConfig({
		...environmentFunctions,
	})
	console.log(config)

	// Create a mock environment
	const env = mockEnvironment({ copyDirectory: { fs, paths: ["/"] } })

	// Validate config file
	const [, exception] = await validateConfigFile({ file, env })
	if (exception) {
		throw new Error("Invalid config file, please check the documentation for more information.")
	}

	// @ts-ignore
	// const image = await satori(markup, {
	// 	width: 300,
	// 	height: 300,
	// 	fonts: [
	// 		{
	// 			family: "Inter",
	// 			weight: 400,
	// 			data: font,
	// 		},
	// 	],
	// })

	//return image
	return true
}
