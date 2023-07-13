import { describe, test, expect } from "vitest"
import { dedent } from "ts-dedent"
import { transformLanguageJson } from './[language].json.js'
import { initTransformConfig } from './test.utils.js'

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
		const code = transformLanguageJson(
			"",
			initTransformConfig(),
			dedent`
				const someFunction = console.info(123)
			`,
		)
		expect(code).toMatchInlineSnapshot(`
			"import { json } from '@sveltejs/kit';
			import { getResource, reloadResources } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = async ({ params: { language } }) => {
			    await reloadResources();
			    return json(getResource(language) || null);
			};
			const someFunction = console.info(123);"
		`)
	})

	test("should add `entries` export if SvelteKit version >= 1.16.3", () => {
		const code = transformLanguageJson(
			"",
			initTransformConfig({
				svelteKit: {
					version: "1.16.3",
				},
			}),
			"",
		)
		expect(code).toMatchInlineSnapshot(`
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

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformLanguageJson("", config, code)
		expect(transformed).toEqual(code)
	})

	describe("'@inlang/sdk-js' imports", () => {
		test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
			const code = "import { i } from '@inlang/sdk-js'"
			const config = initTransformConfig()
			expect(() => transformLanguageJson("", config, code)).toThrow()
		})

		test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
			const code =
				"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
			const config = initTransformConfig()
			expect(() => transformLanguageJson("", config, code)).not.toThrow()
		})
	})
})
