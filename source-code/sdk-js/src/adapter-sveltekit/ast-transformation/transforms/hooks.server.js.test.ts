import { describe, it, expect } from "vitest"
import { dedent } from "ts-dedent"
import { transformHooksServerJs } from "../transforms/hooks.server.js.js"
import { baseTestConfig } from "./test-helpers/config.js"
import type { TransformConfig } from "../config.js"

describe("transformHooksServerJs", () => {
	describe("basics", () => {
		it.skip("adds handle function to an empty file", () => {
			const code = transformHooksServerJs({} as TransformConfig, "")
			expect(code).toMatchInlineSnapshot(`
				"import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
				export const handle = initHandleWrapper({
				  getLanguage: () => undefined
				}).wrap(async ({ event, resolve }) => resolve(event));"
			`)
		})

		it.skip("adds handle endpoint to a file with arbitrary contents", () => {
			const code = transformHooksServerJs({} as TransformConfig, dedent`
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
			`)
			expect(code).toMatchInlineSnapshot(`
				"import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
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
				}export const handle = initHandleWrapper({
				  getLanguage: () => undefined
				}).wrap(async ({ event, resolve }) => resolve(event));"
			`)
		})

		describe("should wrap handle if already defined", () => {
			it.skip("arrow function", () => {
				const code = transformHooksServerJs({} as TransformConfig, dedent`
					import type { Handle } from '@sveltejs/kit'

					export const handle: Handle = ({ event, resolve }) => {

						event.locals = {
							userId: 123
						}

						return resolve(event)
					}
				`)

				expect(code).toMatchInlineSnapshot(`
					"import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					import type { Handle } from '@sveltejs/kit';

					export const handle: Handle = initHandleWrapper({
					  getLanguage: () => undefined
					}).wrap(({ event, resolve }) => {

						event.locals = {
							userId: 123
						}

						return resolve(event)
					})"
				`)
			})

			it.skip("function keyword", () => {
				const code = transformHooksServerJs({} as TransformConfig, dedent`
					export function handle({ event, resolve }) {
						console.log('TADAA!')
						return resolve(event)
					}
				`)

				expect(code).toMatchInlineSnapshot(`
					"import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const handle = initHandleWrapper({
					  getLanguage: () => undefined
					}).wrap(function handle({ event, resolve }) {
						console.log('TADAA!')
						return resolve(event)
					});"
				`)
			})
		})
	})

	describe("variations", () => {
		it.skip("languageInUrl", () => {
			const config: TransformConfig = {
				...baseTestConfig,
				languageInUrl: true,
				isStatic: true,
			}
			const code = transformHooksServerJs(config, "")
			expect(code).toMatchInlineSnapshot(`
				"import { replaceLanguageInUrl } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
				import { redirect } from \\"@sveltejs/kit\\";
				import { initAcceptLanguageHeaderDetector } from \\"@inlang/sdk-js/detectors/server\\";
				import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
				export const handle = initHandleWrapper({
					getLanguage: ({ url }) => url.pathname.split.skip("/")[1],
					initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
					redirect: {
						throwable: redirect,
						getPath: ({ url }, language) => replaceLanguageInUrl(url, language),
					},
				}).wrap(async ({ event, resolve }) => resolve(event));"
			`)
		})

		it.skip("languageInUrl and isStatic", () => {
			const config: TransformConfig = {
				...baseTestConfig,
				languageInUrl: true,
				isStatic: true,
			}
			const code = transformHooksServerJs(config, "")
			expect(code).toMatchInlineSnapshot(`
				"import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
				export const handle = initHandleWrapper({
				  getLanguage: ({ url }) => url.pathname.split.skip(\\"/\\")[1]
				}).wrap(async ({ event, resolve }) => resolve(event));"
			`)
		})

		it.skip("isStatic", () => {
			const config: TransformConfig = {
				...baseTestConfig,
				isStatic: true,
			}
			const code = transformHooksServerJs(config, "")
			expect(code).toMatchInlineSnapshot(`
				"import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
				export const handle = initHandleWrapper({
				  getLanguage: () => undefined
				}).wrap(async ({ event, resolve }) => resolve(event));"
			`)
		})
	})

	describe.todo("detectors", () => { })
})
