import { dedent } from "ts-dedent"
import { describe, expect, it } from "vitest"
import { transformLayoutServerJs } from "./+layout.server.js.js"
import { baseTestConfig } from './test-helpers/config.js'

describe("transformLayoutServerJs", () => {
	describe("root=true", () => {
		describe("basics", () => {
			it("adds load function to an empty file", () => {
				const code = transformLayoutServerJs(baseTestConfig, "", true)
				expect(code).toMatchInlineSnapshot(`
					"import { initRootLayoutServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const load = initRootLayoutServerLoadWrapper().wrap(() => {});"
				`)
			})

			it("adds handle endpoint to a file with arbitrary contents", () => {
				const code = transformLayoutServerJs(
					baseTestConfig,
					dedent`
					export const prerender = true;
				`,
					true,
				)
				expect(code).toMatchInlineSnapshot(`
					"import { initRootLayoutServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const prerender = true;
					export const load = initRootLayoutServerLoadWrapper().wrap(() => {});"
				`)
			})

			describe("should wrap handle if already defined", () => {
				it("arrow function", () => {
					const code = transformLayoutServerJs(
						baseTestConfig,
						dedent`
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = ({ locals }) => {
							return {
								userId: locals.userId
							}
						}
					`,
						true,
					)

					expect(code).toMatchInlineSnapshot(`
						"import { initRootLayoutServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load = initRootLayoutServerLoadWrapper().wrap(({ locals }) => {
							return {
								userId: locals.userId
							}
						});"
					`)
				})

				it("function keyword", () => {
					const code = transformLayoutServerJs(
						baseTestConfig,
						dedent`
						import type { LayoutLoad } from './$types.js'

						export async function load({ }) {
							console.log('hi!')
							return { }
						}
					`,
						true,
					)

					expect(code).toMatchInlineSnapshot(`
						"import { initRootLayoutServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load = initRootLayoutServerLoadWrapper().wrap(async function load({ }) {
							console.log('hi!')
							return { }
						});"
					`)
				})
			})
		})
	})

	describe("root=false", () => {
		describe("basics", () => {
			it("adds load function to an empty file", () => {
				const code = transformLayoutServerJs(baseTestConfig, "", false)
				expect(code).toMatchInlineSnapshot(`
					"import { initServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const load = initServerLoadWrapper().wrap(() => {});"
				`)
			})

			it("adds handle endpoint to a file with arbitrary contents", () => {
				const code = transformLayoutServerJs(
					baseTestConfig,
					dedent`
					export const prerender = true;
				`,
					false,
				)
				expect(code).toMatchInlineSnapshot(`
					"import { initServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const prerender = true;
					export const load = initServerLoadWrapper().wrap(() => {});"
				`)
			})

			describe("should wrap handle if already defined", () => {
				it("arrow function", () => {
					const code = transformLayoutServerJs(
						baseTestConfig,
						dedent`
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = ({ locals }) => {
							return {
								userId: locals.userId
							}
						}
					`,
						false,
					)

					expect(code).toMatchInlineSnapshot(`
						"import { initServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load = initServerLoadWrapper().wrap(({ locals }) => {
							return {
								userId: locals.userId
							}
						});"
					`)
				})

				it("function keyword", () => {
					const code = transformLayoutServerJs(
						baseTestConfig,
						dedent`
						import type { LayoutLoad } from './$types.js'

						export async function load({ }) {
							console.log('hi!')
							return { }
						}
					`,
						false,
					)

					expect(code).toMatchInlineSnapshot(`
						"import { initServerLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load = initServerLoadWrapper().wrap(async function load({ }) {
							console.log('hi!')
							return { }
						});"
					`)
				})
			})
		})
	})
})

// NOTES
// - Allows merging of already present and required imports
// - adds an empty exported arrow function named load if not present
// - Wraps this load function (whether present or not) with initRootServerLayoutLoadWrapper().wrap()
// - Adds options to initRootServerLayoutLoadWrapper if necessary
