import { describe, test, expect } from "vitest"
import { dedent } from "ts-dedent"
import { transformLanguageJson } from "./[language].json.js"
import { initTransformConfig } from "./test.utils.js"

describe("transformLanguageJson", () => {
	test("should throw if GET endpoint is already defined", () => {
		expect(() =>
			transformLanguageJson(
				"",
				initTransformConfig(),
				dedent`
					export const GET = () => json({ hackerman: true })
				`,
			),
		).toThrowError()
	})

	test("empty file", () => {
		const code = ""
		const transformed = transformLanguageJson("", initTransformConfig(), code)

		expect(transformed).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { getResource, reloadResources } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = async ({ params: { language } }) => {
			    await reloadResources();
			    return json(getResource(language) || null);
			};"
		`)
	})

	test("adds GET endpoint to a file with arbitrary contents", () => {
		const transformed = transformLanguageJson(
			"",
			initTransformConfig(),
			dedent`
				const someFunction = console.info(123)
			`,
		)
		expect(transformed).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { getResource, reloadResources } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = async ({ params: { language } }) => {
			    await reloadResources();
			    return json(getResource(language) || null);
			};
			const someFunction = console.info(123);"
		`)
	})

	describe("variations", () => {
		test("should add `entries` export if SvelteKit version >= 1.16.3", () => {
			const transformed = transformLanguageJson(
				"",
				initTransformConfig({
					svelteKit: {
						version: "1.16.3",
					},
				}),
				"",
			)
			expect(transformed).toMatchInlineSnapshot(`
				"import { json } from '@sveltejs/kit';
				export const entries = async () => {
				    const { languages } = await initState(await import('../../../../inlang.config.js'));
				    return languages.map(language => ({ language }));
				};
				import { initState, getResource, reloadResources } from '@inlang/sdk-js/adapter-sveltekit/server';
				export const GET = async ({ params: { language } }) => {
				    await reloadResources();
				    return json(getResource(language) || null);
				};"
			`)
		})

		test("static output", () => {
			const code = ""
			const transformed = transformLanguageJson(
				"",
				initTransformConfig({
					isStatic: true,
					inlang: { sdk: { resources: { cache: "build-time" } } },
				}),
				code,
			)

			expect(transformed).toMatchInlineSnapshot(`
				"import { json } from '@sveltejs/kit';
				import { getResource, reloadResources } from '@inlang/sdk-js/adapter-sveltekit/server';
				export const GET = async ({ params: { language } }) => {
				    await reloadResources();
				    return json(getResource(language) || null);
				};
				export const prerender = true;"
			`)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformLanguageJson("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformLanguageJson(
			"",
			initTransformConfig(),
			dedent`
				import { languages } from '@inlang/sdk-js'

				export async function POST() {
					return { languages }
				}
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { getResource, reloadResources, initRequestHandlerWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = initRequestHandlerWrapper().use(async ({ params: { language } }, { languages }) => {
			    await reloadResources();
			    return json(getResource(language) || null);
			});
			export const POST = initRequestHandlerWrapper().use(async function POST(_, { languages }) {
			    return { languages };
			});"
		`)
	})
})
