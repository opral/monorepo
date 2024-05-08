import { rollup } from "rollup"
import { plugins } from "./plugins.mjs"
import fs from "node:fs/promises"

//remove the old dist folder
await fs.rm("./dist", { recursive: true, force: true })

const packageJson = JSON.parse(await fs.readFile("./package.json", "utf-8"))
const version = packageJson.version
if (typeof version !== "string") {
	throw new Error("the version in package.json is not a string")
}
const peerDependencies = Object.keys(packageJson.peerDependencies || {})
const dependencies = Object.keys(packageJson.dependencies || {})

// eslint-disable-next-line no-undef
// eslint-disable-next-line no-console
// eslint-disable-next-line no-undef
console.info(`Building ${packageJson.name} v${packageJson.version}...`)

const external = [
	/node_modules/,
	/^node:/,
	"$paraglide/runtime.js",
	...peerDependencies,
	...dependencies,
]

const app_build = await rollup({
	plugins,
	input: {
		"app/index.server": "src/app/index.server.tsx",
		"app/index.client": "src/app/index.client.tsx",
	},
	external,
})

const pages_build = await rollup({
	plugins,
	input: {
		"pages/index": "src/pages/index.tsx",
	},
	external,
})

const pluginBuild = await rollup({
	plugins,
	input: {
		"plugin/index": "src/plugin/index.ts",
	},
	external,
})

const cliBuild = await rollup({
	plugins,
	input: {
		"cli/index": "src/cli/index.ts",
	},
	external: [/^node:/, ...peerDependencies, ...dependencies],
})

await app_build.write({
	preserveModules: true,
	format: "es",
	entryFileNames: "[name].js",
	dir: "dist",
})

await pages_build.write({
	format: "cjs",
	entryFileNames: "[name].js",
	dir: "dist",
})

await pluginBuild.write({
	format: "cjs",
	entryFileNames: "[name].cjs",
	dir: "dist",
})

await cliBuild.write({
	preserveModules: true,
	format: "esm",
	entryFileNames: "[name].mjs",
	dir: "dist",
})
