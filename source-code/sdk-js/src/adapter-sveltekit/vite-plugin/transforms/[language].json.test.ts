import { describe, it, expect } from "vitest"
import { dedent } from "ts-dedent"
import type { TransformConfig } from '../config.js'
import { transformLanguageJson } from "../transforms/[language].json.js"
import { getTransformConfig } from './test-helpers/config.js'

describe("transformLanguageJson", () => {
	it("adds GET endpoint to an empty file", () => {
		const code = transformLanguageJson(getTransformConfig(), "")
		expect(code).toMatchInlineSnapshot(`
			"
			import { json } from \\"@sveltejs/kit\\"
			import { getResource, reloadResources } from \\"@inlang/sdk-js/adapter-sveltekit/server\\"

			export const GET = async ({ params: { language } }) => {
				await reloadResources()
				return json(getResource(language) || null)
			}


			"
		`)
	})

	it("should add `entries` if SvelteKit version >= 1.16.3", () => {
		const code = transformLanguageJson(getTransformConfig({
			svelteKit: {
				version: '1.16.3' as TransformConfig['svelteKit']['version']
			}
		}), "")
		expect(code).toMatchInlineSnapshot(`
			"
			import { json } from \\"@sveltejs/kit\\"
			import { getResource, reloadResources } from \\"@inlang/sdk-js/adapter-sveltekit/server\\"

			export const GET = async ({ params: { language } }) => {
				await reloadResources()
				return json(getResource(language) || null)
			}


			import { initState } from '@inlang/sdk-js/adapter-sveltekit/server'

			export const entries = async () => {
				const { languages } = await initState(await import('../../../../inlang.config.js'))

				return languages.map(language => ({ language }))
			}
			"
		`)
	})

	it.skip("adds GET endpoint to a file with arbitrary contents", () => {
		const code = transformLanguageJson(getTransformConfig(), dedent`
			import { error } from "@sveltejs/kit"

			export const GET = () => {
				throw error(500, 'not implemented')
			}
		`)
		expect(code).toMatchInlineSnapshot(`
			"
			import { json, error } from \\"@sveltejs/kit\\"
			import { getResource } from \\"@inlang/sdk-js/adapter-sveltekit/server\\"

			export const GET = (({ params: { language } }) =>
				json(getResource(language) || null))

			export const POST = () => {
				throw Error('not implemented')
			}
			"
		`)
	})

	describe("should throw if GET endpoint is already defined", () => {
		it.skip("arrow function", () => {
			expect(() => transformLanguageJson(getTransformConfig(), dedent`
				import { error } from "@sveltejs/kit"

				export const GET = () => json({ hackerman: true })
			`)).toThrowError()
		})

		it.skip("function keyword", () => {
			expect(() => transformLanguageJson(getTransformConfig(), `
				import { error } from "@sveltejs/kit"

				export async function GET({ params }) {
					return new Response(params.language)
				}
			`)).toThrowError()
		})
	})
})
