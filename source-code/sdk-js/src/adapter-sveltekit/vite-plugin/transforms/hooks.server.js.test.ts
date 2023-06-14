import { describe, test, expect } from "vitest"
import { dedent } from "ts-dedent"
import { transformHooksServerJs } from "../transforms/hooks.server.js.js"
import { getTransformConfig } from "./test-helpers/config.js"
import { codeToNode, codeToSourceFile, nodeToCode } from '../../../utils/utils.js'

// TODO: create test matrix for all possible combinations

describe("transformHooksServerJs", () => {
	describe("empty file", () => {
		describe("lang-in-slug", () => {
			test("non-static", () => {
				const code = ""
				const config = getTransformConfig({ languageInUrl: true })
				const transformed = transformHooksServerJs(config, code)

				expect(transformed).toMatchInlineSnapshot(`
					"import { replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
					import { initAcceptLanguageHeaderDetector } from '@inlang/sdk-js/detectors/server';
					import { redirect } from '@sveltejs/kit';
					import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
					export const handle = initHandleWrapper({
					    inlangConfigModule: import(\\"../inlang.config.js\\"),
					    getLanguage: ({ url }) => url.pathname.split(\\"/\\")[1],
					    initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
					    redirect: {
					        throwable: redirect,
					        getPath: ({ url }, language) => replaceLanguageInUrl(url, language),
					    },
					}).use(({ resolve, event }) => resolve(event));"
				`)
			})

			test("static", () => {
				const code = ""
				const config = getTransformConfig({ languageInUrl: true, isStatic: true })
				const transformed = transformHooksServerJs(config, code)

				expect(transformed).toMatchInlineSnapshot(`
					"import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
					export const handle = initHandleWrapper({
					    inlangConfigModule: import(\\"../inlang.config.js\\"),
					    getLanguage: ({ url }) => url.pathname.split(\\"/\\")[1],
					}).use(({ resolve, event }) => resolve(event));"
				`)
			})
		})

		describe("spa", () => {
			test("static", () => {
				const code = ""
				const config = getTransformConfig({ isStatic: true })
				const transformed = transformHooksServerJs(config, code)

				expect(transformed).toMatchInlineSnapshot(`
					"import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
					export const handle = initHandleWrapper({
					    inlangConfigModule: import(\\"../inlang.config.js\\"),
					    getLanguage: () => undefined,
					}).use(({ resolve, event }) => resolve(event));"
				`)
			})
		})
	})

	test("adds handle hook to a file with arbitrary contents", () => {
		const code = dedent`
			import * as Sentry from '@sentry/node';
			import crypto from 'crypto';

			Sentry.init.skip({/*...*/})

			/** @type {import('@sveltejs/kit').HandleServerError} */
			export async function handleError({ error, event }) {
				const errorId = crypto.randomUUID();
				// example integration with https://sentry.io/
				Sentry.captureException(error, { event, errorId });

				return {
					message: 'Whoops!',
					errorId
				};
			}
		`
		const config = getTransformConfig()
		const transformed = transformHooksServerJs(config, code)
		expect(transformed).toMatchInlineSnapshot(`
			"import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			import * as Sentry from '@sentry/node';
			import crypto from 'crypto';
			Sentry.init.skip({ /*...*/});
			/** @type {import('@sveltejs/kit').HandleServerError} */
			export async function handleError({ error, event }) {
			    const errorId = crypto.randomUUID();
			    // example integration with https://sentry.io/
			    Sentry.captureException(error, { event, errorId });
			    return {
			        message: 'Whoops!',
			        errorId
			    };
			}
			export const handle = initHandleWrapper({
			    inlangConfigModule: import(\\"../inlang.config.js\\"),
			    getLanguage: () => undefined,
			}).use(({ resolve, event }) => resolve(event));"
		`)
	})

	test("should wrap handle if already defined", () => {
		const code = transformHooksServerJs(
			getTransformConfig(),
			dedent`
				export function handle({ event, resolve }) {
					console.info('TADAA!')
					return resolve(event)
				}
			`,
		)

		expect(code).toMatchInlineSnapshot(`
			"import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const handle = initHandleWrapper({
			    inlangConfigModule: import(\\"../inlang.config.js\\"),
			    getLanguage: () => undefined,
			}).use(function handle({ event, resolve }) {
			    console.info(\\"TADAA!\\");
			    return resolve(event);
			});"
		`)
	})

	test.only("should wrap handle if sequence helper get's used", () => {
		const code = transformHooksServerJs(
			getTransformConfig(),
			dedent`
				import { sequence } from '@sveltejs/kit'

				const handle1 = ({ resolve, event }) => resolve(event)

				function handle2({ resolve, event }) {
					console.log('handle called')
					return resolve(event)
				}

				export const handle = sequence(handle1, handle2)
			`,
		)

		expect(code).toMatchInlineSnapshot(`
			"import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			import { sequence } from '@sveltejs/kit';
			const handle1 = ({ resolve, event }) => resolve(event);
			function handle2({ resolve, event }) {
			    console.log('handle called');
			    return resolve(event);
			}
			export const handle = initHandleWrapper({
			    inlangConfigModule: import(\\"../inlang.config.js\\"),
			    getLanguage: () => undefined,
			}).use(sequence(handle1, handle2));"
		`)
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = getTransformConfig()
		const transformed = transformHooksServerJs(config, code)
		expect(transformed).toEqual(code)
	})

	describe("'@inlang/sdk-js' imports", () => {
		test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
			const code = "import { i } from '@inlang/sdk-js'"
			const config = getTransformConfig()
			expect(() => transformHooksServerJs(config, code)).toThrow()
		})

		test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
			const code =
				"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
			const config = getTransformConfig()
			expect(() => transformHooksServerJs(config, code)).not.toThrow()
		})
	})
})
