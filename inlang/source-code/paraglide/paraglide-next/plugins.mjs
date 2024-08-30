import { rollup } from "rollup"
import preserveDirectives from "rollup-preserve-directives"
import typescript from "@rollup/plugin-typescript"
import cjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import fs from "node:fs/promises"

const packageJson = JSON.parse(await fs.readFile("./package.json", "utf-8"))
const version = packageJson.version
if (typeof version !== "string") {
	throw new Error("the version in package.json is not a string")
}

export const plugins = [
	typescript({
		tsconfig: "./tsconfig.json",
		exclude: ["**/node_modules/**/*"],
	}),
	cjs(),
	resolve({
		preferBuiltins: true,
	}),
	preserveDirectives(),
	json(),
	replace({
		values: {
			MARKETPLACE_ID: JSON.stringify("library.inlang.paraglideJsAdapterNextJs"),
			PARAGLIDE_NEXT_VERSION: JSON.stringify(version),
		},
		preventAssignment: true,
	}),
]
