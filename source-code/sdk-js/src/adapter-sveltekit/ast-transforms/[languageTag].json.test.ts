import { describe, test, expect } from "vitest"
import { dedent } from "ts-dedent"
import { transformLanguageJson } from "./[languageTag].json.js"
import { initTestApp } from "./test.utils.js"

describe("transformLanguageJson", () => {
	test("should throw if GET endpoint is already defined", () => {
		expect(() =>
			transformLanguageJson(
				"",
				initTestApp(),
				dedent`
					export const GET = () => json({ hackerman: true })
				`,
			),
		).toThrowError()
	})

	test("empty file", () => {
		const code = ""
		const transformed = transformLanguageJson("", initTestApp(), code)

		expect(transformed).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { loadMessages, reloadMessages } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = async ({ params: { languageTag } }) => {
			    return json(loadMessages(languageTag) || null);
			};"
		`)
	})

	test("adds GET endpoint to a file with arbitrary contents", () => {
		const transformed = transformLanguageJson(
			"",
			initTestApp(),
			dedent`
				const someFunction = console.info(123)
			`,
		)
		expect(transformed).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { loadMessages, reloadMessages } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = async ({ params: { languageTag } }) => {
			    return json(loadMessages(languageTag) || null);
			};
			const someFunction = console.info(123);"
		`)
	})

	describe("variations", () => {
		test("should add `entries` export if SvelteKit version >= 1.16.3", () => {
			const transformed = transformLanguageJson(
				"",
				initTestApp({
					svelteKit: {
						version: "1.16.3",
					},
				}),
				"",
			)
			expect(transformed).toMatchInlineSnapshot(`
				"import { json } from '@sveltejs/kit';
				export const entries = async () => {
				    const { languageTags } = await initState();
				    return languageTags.map(languageTag => ({ languageTag }));
				};
				import { initState, loadMessages, reloadMessages } from '@inlang/sdk-js/adapter-sveltekit/server';
				export const GET = async ({ params: { languageTag } }) => {
				    return json(loadMessages(languageTag) || null);
				};"
			`)
		})

		test("static output", () => {
			const code = ""
			const transformed = transformLanguageJson(
				"",
				initTestApp({
					options: {
						isStatic: true,
						resourcesCache: "build-time",
					},
				}),
				code,
			)

			expect(transformed).toMatchInlineSnapshot(`
				"import { json } from '@sveltejs/kit';
				import { loadMessages, reloadMessages } from '@inlang/sdk-js/adapter-sveltekit/server';
				export const GET = async ({ params: { languageTag } }) => {
				    return json(loadMessages(languageTag) || null);
				};
				export const prerender = true;"
			`)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTestApp()
		const transformed = transformLanguageJson("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformLanguageJson(
			"",
			initTestApp(),
			dedent`
				import { languages } from '@inlang/sdk-js'

				export async function POST() {
					return { languages }
				}
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { loadMessages, reloadMessages, initRequestHandlerWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = initRequestHandlerWrapper().use(async ({ params: { languageTag } }, { languages }) => {
			    return json(loadMessages(languageTag) || null);
			});
			export const POST = initRequestHandlerWrapper().use(async function POST(_, { languages }) {
			    return { languages };
			});"
		`)
	})
})
