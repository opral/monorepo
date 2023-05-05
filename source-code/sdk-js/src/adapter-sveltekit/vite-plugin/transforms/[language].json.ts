import type { TransformConfig } from '../config.js'

// TODO: @benjaminpreiss: transform
export const transformLanguageJson = (config: TransformConfig, code: string) => {
	if (code) {
		// TODO: throw error if file contains a GET endpoint; currently we just override it
		// throw new Error()
	}

	return `
import { json } from "@sveltejs/kit"
import { getResource } from "@inlang/sdk-js/adapter-sveltekit/server"

export const GET = (({ params: { language } }) =>
	json(getResource(language) || null))
`
}