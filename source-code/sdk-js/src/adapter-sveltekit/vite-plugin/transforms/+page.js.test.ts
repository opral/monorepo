import { describe, expect, test } from "vitest"
import { getTransformConfig } from "./test-helpers/config.js"
import { dedent } from "ts-dedent"
import { transformPageJs } from './+page.js.js'

describe("transformPageJs", () => {
	describe("root=true", () => {
		test("Insert into empty file with only {browser} as options", () => {
			const code = ""
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformPageJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';

				export const load = initRootPageLoadWrapper({
				   browser
				}).wrap(() => {});"
			`)
		})

		test("Insert into empty file with options", () => {
			const code = ""
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
				isStatic: true,
			}
			const transformed = transformPageJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { redirect } from '@sveltejs/kit';
				import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';

				export const load = initRootPageLoadWrapper({
				   browser,
				   initDetectors: () => [navigatorDetector],

				   redirect: {
					   throwable: redirect,

					   getPath: (
						   {
							   url
							},
							language
						) => replaceLanguageInUrl(new URL(url), language)
					}
				}).wrap(() => {});"
			`)
		})

		test("Wrap basic load function", () => {
			const code = dedent`
				export const load = async () => {};
			`
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformPageJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';

				export const load = initRootPageLoadWrapper({
				   browser
				}).wrap(async () => {});"
			`)
		})

		test("Wrap basic load function and merge incomplete imports", () => {
			const code = dedent`
				import { browser } from "$app/environment";
				export const load = async () => {};
			`
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformPageJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';

				export const load = initRootPageLoadWrapper({
				   browser
				}).wrap(async () => {});"
			`)
		})
	})
	describe("root=false", () => {
		test("Wrap basic load function", () => {
			const code = dedent`
				export const load = async () => {};
			`
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformPageJs(config, code, false)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';
				export const load = initLoadWrapper().wrap(async () => {});"
			`)
		})
	})
})

// NOTES
// - Allows merging of already present and required imports
// - adds an empty exported arrow function named load if not present
// - Wraps this load function (whether present or not) with initRootLayoutLoadWrapper().wrap()
// - Adds options to initRootLayoutLoadWrapper if necessary
