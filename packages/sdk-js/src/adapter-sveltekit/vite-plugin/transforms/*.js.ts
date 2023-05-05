import { dedent } from 'ts-dedent'
import type { TransformConfig } from "../config.js"

// TODO: @benjaminpreiss: transform
export const transformJs = (config: TransformConfig, code: string) => {
	if (code.includes("'@inlang/sdk-js'") || code.includes('"@inlang/sdk-js"')) {
		throw Error(dedent`
			This is currently not supported. You can use the following code to make it work:

			// client code${config.languageInUrl ? '' : dedent`
			import { get } from "svelte/store"
			`}
			import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/${config.languageInUrl ? 'not-reactive' : `reactive`}"

			export const clientFn = () => {
				const { i } = getRuntimeFromContext()
				console.log(${config.languageInUrl ? 'i' : `get(i)`}('hello.inlang'))
			}

			// server code
			export const serverFn = (/** @type { import('@inlang/sdk-js/runtime').InlangFunction } */ i) => {
				console.log(i('hello.inlang'))
			}
		`)
	}
	return code
}
