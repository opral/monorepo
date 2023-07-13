import { dedent } from "ts-dedent"
import { describe, it, test, expect, vi } from "vitest"
import { transformLayoutSvelte } from "./+layout.svelte.js"
import { initTransformConfig } from './test.utils.js'

vi.mock("./_.svelte.js", async () => {
	const svelteTransforms = await vi.importActual<typeof import('./_.svelte.js')>('./_.svelte.js')

	return ({
		...svelteTransforms,
		transformSvelte: (_: unknown, __: unknown, c: string) => c,
	})
})

describe("transformLayoutSvelte", () => {
	describe("root=true", () => {
		test("should insert code to an empty file", () => {
			const code = ""
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
				import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				</script>
				{#if language}{#key language}<slot />{/key}{/if}"
			`)
		})

		test("should add code to existing code", () => {
			const code = dedent`
				<script>
					export let data;

					console.log(data)
				</script>

				<h1>this is a test</h1>

				<p>{JSON.stringify(data, null, 3)}</p>
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				console.log(data);
				</script>{#if language}{#key language}

				<h1>this is a test</h1>

				<p>{JSON.stringify(data, null, 3)}</p>{/key}{/if}"
			`)
		})

		test("should not wrap special svelte elements", () => {
			const code = dedent`
				<svelte:window on:load={onLoad} />

				test

				<svelte:body on:click={onClick} />

				other test

				<svelte:head>
					<title>test</title>
				</svelte:head>

				<svelte:options tag="test" />

				random content
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
				import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				</script>
				<svelte:window on:load={onLoad} />{#if language}{#key language}

				test

				{/key}{/if}<svelte:body on:click={onClick} />{#if language}{#key language}

				other test

				{/key}{/if}<svelte:head>
					<title>test</title>
				</svelte:head>{#if language}{#key language}

				{/key}{/if}<svelte:options tag=\\"test\\" />{#if language}{#key language}

				random content{/key}{/if}"
			`)
		})

		test.todo("should wrap code inside special svelte elements", () => {
			const code = dedent`
				<script>
					import { i } from '@inlang/sdk-js'
				</script>

				<svelte:head>
					<title>{i('title')}</title>
				</svelte:head>
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				</script>{#if language}{#key language}

				{/key}{/if}<svelte:head>{#key language}
					<title>{i('title')}</title>
				{/key}{/if}<</svelte:head>"
			`)
		})

		test("should remove @inlang/sdk-js imports that are used reactively", () => {
			const code = dedent`
				<script>
					import { language } from '@inlang/sdk-js'
				</script>

				{language}
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				</script>{#if language}{#key language}

				{language}{/key}{/if}"
			`)
		})

		test("should insert data export right after first import statements", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/sdk-js"
					console.log(i("welcome"))
				</script>

				<slot />
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				console.log(i(\\"welcome\\"));
				</script>{#if language}{#key language}

				<slot />{/key}{/if}"
			`)
		})

		test("should insert code snippets right after data export", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/sdk-js"
					console.log(123)

					export let data

					console.log(i("welcome"))
				</script>

				<slot />
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				console.log(123);
				export let data;
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, language } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, language } = getRuntimeFromContext());
				}
				console.log(i(\\"welcome\\"));
				</script>{#if language}{#key language}

				<slot />{/key}{/if}"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	describe("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		test("in context script tag", () => {
			const code = dedent`
				<script context>
					import '@inlang/sdk-js/no-transforms';
				</script>`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toEqual(code)
		})

		test("in script tag", () => {
			const code = dedent`
				<script>
					import '@inlang/sdk-js/no-transforms';
				</script>`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toEqual(code)
		})
	})
})

describe.skip("transformLayoutSvelte", () => {
	describe("basics", () => {
		describe("root=true", () => {
			describe("transform @inlang/sdk-js", () => {
				it("resolves imports correctly", async () => {
					const transformed = transformLayoutSvelte(
						"",
						initTransformConfig(),
						dedent`
							<script>
								import { languages, i } from "@inlang/sdk-js"

								console.info(languages)
							</script>

							{i('hello')}
						`,
						true,
					)
					expect(transformed).toMatchInlineSnapshot(`
						"<script>import { browser } from \\"$app/environment\\";
						import { getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
						import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
						export let data;
						let language, i, languages;
						addRuntimeToContext(getRuntimeFromData(data));

						({
						    language: language,
						    i: i,
						    languages: languages
						} = getRuntimeFromContext());

						$:
						if (browser && $language) {
						    document.body.parentElement?.setAttribute(\\"lang\\", $language);
						    localStorage.setItem(\\"language\\", $language);
						}

						console.info(languages)</script>

						{#if $language}{$i('hello')}{/if}"
					`)
				})

				it("resolves imports correctly (not-reactive)", async () => {
					const transformed = transformLayoutSvelte(
						"",
						initTransformConfig({
							languageInUrl: true
						}),
						dedent`
							<script>
								import { languages, i } from "@inlang/sdk-js"

								console.info(languages)
							</script>

							{i('hello')}
						`,
						true,
					)
					expect(transformed).toMatchInlineSnapshot(`
						"<script>import { browser } from \\"$app/environment\\";
						import { getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/not-reactive\\";
						import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
						export let data;
						let language, i, languages;
						addRuntimeToContext(getRuntimeFromData(data));

						({
						    language: language,
						    i: i,
						    languages: languages
						} = getRuntimeFromContext());

						$:
						if (browser) {
						    addRuntimeToContext(getRuntimeFromData(data));

						    ({
						        language: language,
						        i: i
						    } = getRuntimeFromContext());
						}

						console.info(languages)</script>

						{#key language}{i('hello')}{/key}"
					`)
				})
			})
		})

		// ------------------------------------------------------------------------------------------

		describe("root=false", () => {
			it("is a proxy for transformSvelte", async () => {
				const config = initTransformConfig()
				const input = dedent`
					<script>
						import { language } from '@inlang/sdk-js'
						export let data
					</script>

					<h1>Hello {data.name}!</h1>

					{language.toUpperCase()}
				`
				const transformed = transformLayoutSvelte("", config, input, false)
				// expect(transformed).toMatch(transformSvelte(config, input))
			})
		})
	})
})
