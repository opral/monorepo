import { rollup } from "rollup"
import preserveDirectives from "rollup-preserve-directives"
import typescript from "@rollup/plugin-typescript"
import cjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import fs from "node:fs/promises"

//remove the old dist folder
await fs.rm("./dist", { recursive: true, force: true })

const packageJson = JSON.parse(await fs.readFile("./package.json", "utf-8"))
const peerDependencies = Object.keys(packageJson.peerDependencies || {})
const dependencies = Object.keys(packageJson.dependencies || {})

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
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), cjs(), resolve(), preserveDirectives()],
	input: {
		"app/index.server": "src/app/index.server.tsx",
		"app/index.client": "src/app/index.client.tsx",
	},
	external,
})

const pages_build = await rollup({
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), cjs(), resolve(), preserveDirectives()],
	input: {
		"pages/index": "src/pages/index.tsx",
	},
	external,
})

const pluginBuild = await rollup({
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), cjs(), resolve(), preserveDirectives()],
	input: {
		"plugin/index": "src/plugin/index.ts",
	},
	external,
})

await app_build.write({
	preserveModules: true,
	format: "es",
	entryFileNames: "[name].js",
	dir: "dist",
})

await pages_build.write({
	preserveModules: false,
	format: "cjs",
	entryFileNames: "[name].js",
	dir: "dist",
})

await pluginBuild.write({
	preserveModules: false,
	format: "cjs",
	entryFileNames: "[name].cjs",
	dir: "dist",
})