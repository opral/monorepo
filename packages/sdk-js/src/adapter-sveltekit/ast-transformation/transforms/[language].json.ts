import type { TransformConfig } from '../config.js'

export const transformLanguageJson = (config: TransformConfig, code: string) => {
	if (code) {
		// TODO: more meaningful error messages
		throw new Error('currently not supported')
	}

	return `
import { json } from "@sveltejs/kit"
import { getResource } from "@inlang/sdk-js/adapter-sveltekit/server"

export const GET = (({ params: { language } }) =>
	json(getResource(language) || null))
`
}