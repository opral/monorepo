import { dedent } from 'ts-dedent'
import { describe, it, expect } from "vitest"
import type { TransformConfig } from '../config.js'
import { transformSvelte } from './*.svelte.js'
import { transformLayoutSvelte } from './+layout.svelte.js'

describe("transformLayoutSvelte", () => {
	describe("basics", () => {
		describe("root=true", () => {
			it.skip("adds code to an empty file", () => {
				const code = transformLayoutSvelte({} as TransformConfig, "", true)
				expect(code).toMatchInlineSnapshot(`
					"
					<script>
						import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\"
						import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\"
						import { browser } from \\"$app/environment\\"

						export let data

						addRuntimeToContext(getRuntimeFromData(data))
						let { i, language } = getRuntimeFromContext()

					$: if (browser && $language) {
						document.body.parentElement?.setAttribute(\\"lang\\", $language)
						// TODO: only if localStorageDetector
						localStorage.setItem(localStorageKey, $language)
					}

					</script>

					{#if $language}
						<slot />
					{/if}

					"
				`)
			})

			it.skip("adds code to a file with arbitrary contents", () => {
				const code = transformLayoutSvelte({} as TransformConfig, dedent`
				<script>
					import { onMount } from "svelte"

					export let data

					onMount(() => {
						console.log(123)
					})
				</script>

				<h1>Hello {data.name}!</h1>
				`, true)
				expect(code).toMatchInlineSnapshot(`
					"
					<script>
						import { onMount } from "svelte"
						import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\"
						import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\"
						import { browser } from \\"$app/environment\\"

						export let data

						addRuntimeToContext(getRuntimeFromData(data))
						let { i, language } = getRuntimeFromContext()

					$: if (browser && $language) {
						document.body.parentElement?.setAttribute(\\"lang\\", $language)
						// TODO: only if localStorageDetector
						localStorage.setItem(localStorageKey, $language)
					}
						onMount(() => {
							console.log(123)
						})
					</script>

					{#if $language}
						<h1>Hello {data.name}!</h1>
					{/if}

					"
				`)
			})

			it.skip("adds script tag if missing", () => {
				const code = transformLayoutSvelte({} as TransformConfig, dedent`
				<h1>Hello {data.name}!</h1>

				<slot />
				`, true)
				expect(code).toMatchInlineSnapshot(`
					"
					<script>
						import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\"
						import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\"
						import { browser } from \\"$app/environment\\"

						export let data

						addRuntimeToContext(getRuntimeFromData(data))
						let { i, language } = getRuntimeFromContext()

					$: if (browser && $language) {
						document.body.parentElement?.setAttribute(\\"lang\\", $language)
						// TODO: only if localStorageDetector
						localStorage.setItem(localStorageKey, $language)
					}
					</script>

					{#if $language}
						<h1>Hello {data.name}!</h1>

						</slot />
					{/if}
					"
				`)
			})

			it.skip("doesn't output markup if no markup is present", () => {
				const code = transformLayoutSvelte({} as TransformConfig, dedent`
				<script>
				console.log(1)
				</script>
				`, true)
				expect(code).toMatchInlineSnapshot(`
					"
					<script>
						import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\"
						import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\"
						import { browser } from \\"$app/environment\\"

						export let data

						addRuntimeToContext(getRuntimeFromData(data))
						let { i, language } = getRuntimeFromContext()

					$: if (browser && $language) {
						document.body.parentElement?.setAttribute(\\"lang\\", $language)
						// TODO: only if localStorageDetector
						localStorage.setItem(localStorageKey, $language)
					}
					console.log(1)
					</script>
					"
				`)
			})
		})

		describe("root=false", () => {
			it.skip("is a proxy for transformSvelte", async () => {
				const config = {} as TransformConfig
				const input = dedent`
				<script>
					export let data
				</script>

				<h1>Hello {data.name}!</h1>
				`
				const code = transformLayoutSvelte(config, input, false)
				expect(code).toMatch(await transformSvelte(config, input))
			})
		})
	})

	describe("transform @inlang/sdk-js", () => {
		it.skip("resolves imports correctly", () => {
			const code = transformLayoutSvelte({} as TransformConfig, dedent`
			<script>
				import { languages, i } from "@inlang/sdk-js"

				console.log(languages)
			</script>

			{i('hello)}

			`, true)
			expect(code).toMatchInlineSnapshot(`
				"
				<script>
					import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\"
					import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\"
					import { browser } from \\"$app/environment\\"

					export let data

					addRuntimeToContext(getRuntimeFromData(data))
					let { i, language } = getRuntimeFromContext()

				$: if (browser && $language) {
					document.body.parentElement?.setAttribute(\\"lang\\", $language)
					// TODO: only if localStorageDetector
					localStorage.setItem(localStorageKey, $language)
				}

				const { languages } = getRuntimeFromContext()
				console.log(languages)
				</script>

				{#if $language}
					{$i('hello)}
				{/if}
				"
			`)
		})
	})
})
