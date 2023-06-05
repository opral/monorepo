import { getContext } from "svelte"
import { inlangSymbol } from "../../shared/utils.js"

// TODO: wrap with error message only during development
export const getRuntimeFromContext = () => {
	try {
		return getContext(inlangSymbol)
	} catch (e) {
		throw Error(
			`
You cannot directly access any '@inlang/sdk-js' imports in this scope. You need to pass them from 'handle' or 'load' to the function you want to call e.g.

// -- Change this -------------------------------------------------------------

import { i } from '@inlang/sdk-js'

export const load = async () => {
   return { title: getPageTitle() }
}

const getPageTitle = () => {
   console.log(i('hello.inlang'))
}

// -- To this -----------------------------------------------------------------

import { i } from '@inlang/sdk-js'

export const load = async () => {
   return { title: getPageTitle(i) }
}

const getPageTitle = (/** @type { import('@inlang/sdk-js/runtime').InlangFunction } */ i) => {
   console.log(i('hello.inlang'))
}

// ----------------------------------------------------------------------------
`,
			{ cause: e },
		)
	}
}
