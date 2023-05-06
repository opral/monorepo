import { describe, it, expect } from "vitest"
import { dedent } from "ts-dedent"
import type { TransformConfig } from '../config.js'
import { transformLanguageJson } from "../transforms/[language].json.js"

describe("transformLanguageJson", () => {
	it("adds GET endpoint to an empty file", () => {
		const code = transformLanguageJson({} as TransformConfig, "")
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

	it.skip("adds GET endpoint to a file with arbitrary contents", () => {
		const code = transformLanguageJson({} as TransformConfig, dedent`
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
			expect(() => transformLanguageJson({} as TransformConfig, dedent`
				import { error } from "@sveltejs/kit"

				export const GET = () => json({ hackerman: true })
			`)).toThrowError()
		})

		it.skip("function keyword", () => {
			expect(() => transformLanguageJson({} as TransformConfig, `
				import { error } from "@sveltejs/kit"

				export async function GET({ params }) {
					return new Response(params.language)
				}
			`)).toThrowError()
		})
	})
})
