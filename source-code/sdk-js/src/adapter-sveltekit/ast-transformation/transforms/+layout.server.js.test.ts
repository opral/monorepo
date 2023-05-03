import { dedent } from 'ts-dedent'
import { describe, expect, it } from "vitest"
import type { TransformConfig } from '../config.js'
import { transformLayoutServerJs } from "./+layout.server.js.js"

describe("transformLayoutServerJs", () => {
	describe("root=true", () => {
		describe("basics", () => {
			it("adds load function to an empty file", () => {
				const code = transformLayoutServerJs({} as TransformConfig, "", true)
				expect(code).toMatchInlineSnapshot(`
					"import { initRootServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const load = initRootServerLayoutLoadWrapper().wrap(async () => {});"
				`)
			})

			it("adds handle endpoint to a file with arbitrary contents", () => {
				const code = transformLayoutServerJs({} as TransformConfig, dedent`
					export cont prerender = true;
				`, true)
				expect(code).toMatchInlineSnapshot(`
					"import { initRootServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export cont prerender = true;
					export const load = initRootServerLayoutLoadWrapper().wrap(async () => {});"
				`)
			})

			describe("should wrap handle if already defined", () => {
				it("arrow function", () => {
					const code = transformLayoutServerJs({} as TransformConfig, dedent`
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = ({ locals }) => {
							return {
								userId: locals.userId
							}
						}
					`, true)

					expect(code).toMatchInlineSnapshot(`
						"import { initRootServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = initRootServerLayoutLoadWrapper().wrap(({ locals }) => {
							return {
								userId: locals.userId
							}
						})"
					`)
				})

				it("function keyword", () => {
					const code = transformLayoutServerJs({} as TransformConfig, dedent`
						import type { LayoutLoad } from './$types.js'

						export async function load({ }) {
							console.log('hi!')
							return { }
						}
					`, true)

					expect(code).toMatchInlineSnapshot(`
						"import { initRootServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = initRootServerLayoutLoadWrapper().wrap(async function load({ }) {
							console.log('hi!')
							return { }
						})"
					`)
				})
			})
		})
	})

	describe("root=false", () => {
		describe("basics", () => {
			it("adds load function to an empty file", () => {
				const code = transformLayoutServerJs({} as TransformConfig, "", false)
				expect(code).toMatchInlineSnapshot(`
					"import { initServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export const load = initServerLayoutLoadWrapper().wrap(async () => {});"
				`)
			})

			it("adds handle endpoint to a file with arbitrary contents", () => {
				const code = transformLayoutServerJs({} as TransformConfig, dedent`
					export cont prerender = true;
				`, false)
				expect(code).toMatchInlineSnapshot(`
					"import { initServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
					export cont prerender = true;
					export const load = initServerLayoutLoadWrapper().wrap(async () => {});"
				`)
			})

			describe("should wrap handle if already defined", () => {
				it("arrow function", () => {
					const code = transformLayoutServerJs({} as TransformConfig, dedent`
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = ({ locals }) => {
							return {
								userId: locals.userId
							}
						}
					`, false)

					expect(code).toMatchInlineSnapshot(`
						"import { initServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = initServerLayoutLoadWrapper().wrap(({ locals }) => {
							return {
								userId: locals.userId
							}
						})"
					`)
				})

				it("function keyword", () => {
					const code = transformLayoutServerJs({} as TransformConfig, dedent`
						import type { LayoutLoad } from './$types.js'

						export async function load({ }) {
							console.log('hi!')
							return { }
						}
					`, false)

					expect(code).toMatchInlineSnapshot(`
						"import { initServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
						import type { LayoutLoad } from './$types.js'

						export const load: LayoutLoad = initServerLayoutLoadWrapper().wrap(async function load({ }) {
							console.log('hi!')
							return { }
						})"
					`)
				})
			})
		})
	})

})
