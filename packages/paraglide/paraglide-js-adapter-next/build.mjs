import { rollup } from "rollup"
import preserveDirectives from "rollup-preserve-directives"
import typescript from "@rollup/plugin-typescript"
import cjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import fs from "fs/promises"

//remove the old dist folder
await fs.rm("./dist", { recursive: true, force: true })

const packageJson = JSON.parse(await fs.readFile("./package.json", "utf-8"))
const peerDependencies = Object.keys(packageJson.peerDependencies || {})
const dependencies = Object.keys(packageJson.dependencies || {})

console.log(`Building ${packageJson.name} v${packageJson.version}...`)

const app_build = await rollup({
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), cjs(), resolve(), preserveDirectives()],
	input: {
		index: "src/index.tsx",
		"app/navigation/index": "src/app/navigation/index.tsx",
		"app/middleware": "src/app/middleware.tsx",
	},
	external: [
		/node_modules/,
		"$paraglide-adapter-next-internal/runtime.js",
		"path",
		"url",
		"fs/promises",
		"@inlang/sdk",
		...peerDependencies,
		...dependencies,
	],
})

const pages_build = await rollup({
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), cjs(), resolve(), preserveDirectives()],
	input: {
		"pages/entry": "src/pages/index.tsx",
	},
	external: [
		/node_modules/,
		"$paraglide-adapter-next-internal/runtime.js",
		"path",
		"url",
		"fs/promises",
		"@inlang/sdk",
		...peerDependencies,
		...dependencies,
	],
})

const pluginBuild = await rollup({
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), cjs(), resolve(), preserveDirectives()],
	input: {
		"plugin/index": "src/plugin/index.ts",
	},
	external: [
		/node_modules/,
		"$paraglide-adapter-next-internal/runtime.js",
		"path",
		"url",
		"fs/promises",
		"@inlang/sdk",
		...peerDependencies,
		...dependencies,
	],
})

await pluginBuild.write({
	preserveModules: false,
	format: "cjs",
	entryFileNames: "[name].cjs",
	dir: "dist",
})

await app_build.write({
	preserveModules: true,
	format: "es",
	entryFileNames: "[name].js",
	dir: "dist",
})

await pages_build.write({
	preserveModules: false,
	format: "es",
	entryFileNames: "[name].js",
	dir: "dist",
})
