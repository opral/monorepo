import type { TransformConfig } from '../config.js'

// TODO: @benjaminpreiss: transform
export const transformLanguageJson = (config: TransformConfig, code: string) => {
	if (code) {
		// TODO: throw error if file contains any other export that does not begin with `_`; currently we just override it
		// throw new Error()
	}

	return `
import { json } from "@sveltejs/kit"
import { getResource, reloadResources } from "@inlang/sdk-js/adapter-sveltekit/server"

export const GET = async ({ params: { language } }) => {
	await reloadResources()
	return json(getResource(language) || null)
}

${config.svelteKit.version || '' >= '1.16.3' ? `
import { initState } from '@inlang/sdk-js/adapter-sveltekit/server'

export const prerender = true

export const entries = async () => {
	const { languages } = await initState(await import('../../../../inlang.config.js'))

	return languages.map(language => ({ language }))
}` : ''}
`
}