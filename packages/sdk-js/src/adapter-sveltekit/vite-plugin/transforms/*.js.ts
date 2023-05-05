import { dedent } from 'ts-dedent'
import type { TransformConfig } from "../config.js"

// TODO: @benjaminpreiss: transform
export const transformJs = (config: TransformConfig, code: string) => {
	if (code.includes("'@inlang/sdk-js'") || code.includes('"@inlang/sdk-js"')) {
		throw Error(dedent`
			It is currently not supported to import something from '@inlang/sdk-js' in this file. You can use the following code to make it work:

			// client code${config.languageInUrl ? '' : dedent`
			import { get } from "svelte/store"
			`}
			import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/${config.languageInUrl ? 'not-reactive' : `reactive`}"

			export const clientFn = () => {
				const { i } = getRuntimeFromContext()
				console.log(${config.languageInUrl ? 'i' : `get(i)`}('hello.inlang'))
			}

			// server code
			// you need to pass in the function as a parameter
			export const serverFn = (/** @type { import('@inlang/sdk-js/runtime').InlangFunction } */ i) => {
				console.log(i('hello.inlang'))
			}
		`)
	}
	return code
}
