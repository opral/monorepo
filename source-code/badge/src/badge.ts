import satori from "satori"
import { html } from "satori-html"
import clone from "./repo/clone.js"
import { Config, EnvironmentFunctions, initialize$import } from "@inlang/core/config"
import { getLintReports, lint } from "@inlang/core/lint"
import { Volume } from "memfs"
import type { fs as memfs } from "memfs"
import type * as ast from "@inlang/core/ast"

const markup = (percentage: number) => html` <div style="display: flex;">
	<style></style>
	<div
		style="display: flex;
			background: #333;
			border-radius: 13px;
			height: 20px;
			width: 300px;
			padding: 3px;
			overflow: hidden;"
		id="progress"
	>
		<div
			style="display: flex;
			background: #4c1;
			height: 100%;
			border-radius: 9px;
			width: ${percentage}%;
			transition: width 0.5s ease-in-out;"
		></div>
	</div>
</div>`

// const font = readFileSync(new URL("./assets/static/Inter-Medium.ttf", import.meta.url))

export const badge = async (url: string) => {
	// initialize a new file system on each request to prevent cross request pollution
	const fs = Volume.fromJSON({})
	await clone(url, fs)
	// Set up the environment functions
	const env: EnvironmentFunctions = {
		$import: initialize$import({
			fs: patchedFs(fs.promises),
			fetch,
		}),
		$fs: patchedFs(fs.promises),
	}
	if (fs.existsSync("/inlang.config.js") === false) {
		// @felixhaeberle you should render a badge here that says "no inlang.config.js file found in the repository"
		throw new Error("No inlang.config.js file found in the repository.")
	}
	// Get the content of the inlang.config.js file
	const file = await fs.promises.readFile("/inlang.config.js", "utf-8")
	const { defineConfig } = await import(
		"data:application/javascript;base64," + btoa(file.toString())
	)
	const config: Config = await defineConfig(env)
	const resources = await config.readResources({ config })

	const [resourcesWithLints, errors] = await lint({ resources, config })
	if (errors) {
		console.error("lints partially failed", errors)
	}

	const percentages = getRessourcePercentages(resourcesWithLints)

	const lints = getLintReports(resourcesWithLints)

	// @ts-ignore
	const image = await satori(markup(percentages[1].percentage), {
		width: 300,
		height: 300,
		fonts: [],
	})

	// return image
	return image
}

/**
 * Patching relative paths to absolute paths.
 *
 * Memfs does not support relative paths, so we need to patch them.
 */
const patchedFs = (fs: (typeof memfs)["promises"]) =>
	new Proxy(fs, {
		get: (target, prop) => {
			if (prop === "readFile") {
				return (path: string) => {
					if (path.startsWith("./")) {
						return fs.readFile(path.slice(1))
					}
					return fs.readFile(path)
				}
			} else if (prop === "readdir") {
				return (path: string, args: any) => {
					if (path.startsWith("./")) {
						return fs.readdir(path.slice(1), args)
					}
					return fs.readdir(path, args)
				}
			}
			return target[prop as keyof typeof target]
		},
	})

/**
 * Get the percentage of translated messages.
 */
const getRessourcePercentages = (resources: ast.Resource[]) => {
	// Define return type
	const _percentages: {
		lang: string
		percentage: number
		count: { total: number; lint: number }
	}[] = []

	// Calculate the percentage
	resources.map((resource: ast.Resource) => {
		const lintCount = resource.body.reduce((acc: number, message: ast.Message) => {
			if (message.lint) {
				return acc + 1
			}
			return acc
		}, 0)
		const percentage = ((lintCount / resource.body.length) * 100).toFixed(2)

		// Push the percentage to the return array
		_percentages.push({
			lang: resource.languageTag.name,
			percentage: Number(percentage),
			count: {
				total: resource.body.length,
				lint: lintCount,
			},
		})
	})

	return _percentages
}
