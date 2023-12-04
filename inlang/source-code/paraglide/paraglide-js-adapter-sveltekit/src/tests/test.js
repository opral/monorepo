import { compile } from "svelte/compiler"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import { nodeResolve } from "@rollup/plugin-node-resolve"

const Result = compile(
	`
        <a href="test">
            <span>test</span>
        </a>
`,
	{ generate: "ssr" }
)
const code = Result.js.code

const bundle = await rollup({
	input: "entry.js",
	plugins: [
		nodeResolve(),
		// @ts-ignore - rollup types are not up to date
		virtual({
			"entry.js": code,
		}),
	],
})

// dynamically import the compiled output
const compiledBundle = await bundle.generate({ format: "esm" })
console.log(compiledBundle.output[0].code)

const module = await import(
	`data:application/javascript;base64,${Buffer.from(compiledBundle.output[0].code, "utf8").toString(
		"base64"
	)}`
)

const Component = module.default

/**
 * @type {{ html: string, head: string }}
 */
const { html, head } = Component.render()

console.log(html, head)
