import { dedent } from "ts-dedent"
import { describe, it, test, expect, vi } from "vitest"
import { transformLayoutSvelte } from "./+layout.svelte.js"
import { initTransformConfig } from "./test.utils.js"

vi.mock("./_.svelte.js", async () => {
	const svelteTransforms = await vi.importActual<typeof import("./_.svelte.js")>("./_.svelte.js")

	return {
		...svelteTransforms,
		transformSvelte: (_: unknown, __: unknown, c: string) => c,
	}
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
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				</script>
				{#key languageTag}<slot />{/key}"
			`)
		})

		test("should add code to existing code", () => {
			const code = dedent`
				<script>
					export let data;

					console.info(data)
				</script>

				<h1>this is a test</h1>

				<p>{JSON.stringify(data, null, 3)}</p>
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				console.info(data);
				</script>{#key languageTag}

				<h1>this is a test</h1>

				<p>{JSON.stringify(data, null, 3)}</p>{/key}"
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
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				</script>
				<svelte:window on:load={onLoad} />{#key languageTag}

				test

				{/key}<svelte:body on:click={onClick} />{#key languageTag}

				other test

				{/key}<svelte:head>
					<title>test</title>
				</svelte:head>{#key languageTag}

				{/key}<svelte:options tag=\\"test\\" />{#key languageTag}

				random content{/key}"
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
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				}
				</script>{#if languageTag}{#key languageTag}

				{/key}{/if}<svelte:head>{#key languageTag}
					<title>{i('title')}</title>
				{/key}{/if}<</svelte:head>"
			`)
		})

		test("should remove @inlang/sdk-js imports that are used reactively", () => {
			const code = dedent`
				<script>
					import { languageTag } from '@inlang/sdk-js'
				</script>

				{languageTag}
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				</script>{#key languageTag}

				{languageTag}{/key}"
			`)
		})

		test("should insert data export right after first import statements", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/sdk-js"
					console.info(i("welcome"))
				</script>

				<slot />
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				console.info(i(\\"welcome\\"));
				</script>{#key languageTag}

				<slot />{/key}"
			`)
		})

		test("should insert code snippets right after data export", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/sdk-js"
					console.info(123)

					export let data

					console.info(i("welcome"))
				</script>

				<slot />
			`
			const config = initTransformConfig()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				console.info(123);
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				console.info(i(\\"welcome\\"));
				</script>{#key languageTag}

				<slot />{/key}"
			`)
		})

		test("languageInUrl", () => {
			const code = ""
			const config = initTransformConfig({ languageInUrl: true })
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
				import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', language);
				}
				</script>
				{#key languageTag}<slot />{/key}"
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
								import { languageTags, i } from "@inlang/sdk-js"

								console.info(languageTags)
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
						let languageTag, i, languageTags;
						addRuntimeToContext(getRuntimeFromData(data));

						({
						    languageTag,
						    i,
						    languageTags
						} = getRuntimeFromContext());

						$:
						if (browser && $languageTag) {
						    document.body.parentElement?.setAttribute(\\"lang\\", $languageTag);
						    localStorage.setItem(\\"languageTag\\", $languageTag);
						}

						console.info(languageTags)</script>

						{#if $languageTag}{$i('hello')}{/if}"
					`)
				})

				it("resolves imports correctly (not-reactive)", async () => {
					const transformed = transformLayoutSvelte(
						"",
						initTransformConfig({
							languageInUrl: true,
						}),
						dedent`
							<script>
								import { languageTags, i } from "@inlang/sdk-js"

								console.info(languageTags)
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
						let languageTag, i, languageTags;
						addRuntimeToContext(getRuntimeFromData(data));

						({
						    languageTag,
						    i,
						    languageTags
						} = getRuntimeFromContext());

						$:
						if (browser) {
						    addRuntimeToContext(getRuntimeFromData(data));

						    ({
						        languageTag,
						        i: i
						    } = getRuntimeFromContext());
						}

						console.info(languageTags)</script>

						{#key languageTag}{i('hello')}{/key}"
					`)
				})
			})
		})

		// ------------------------------------------------------------------------------------------

		describe("root=false", () => {
			it("is a proxy for transformSvelte", async () => {
				// const config = initTransformConfig()
				// const input = dedent`
				// 	<script>
				// 		import { languageTag } from '@inlang/sdk-js'
				// 		export let data
				// 	</script>
				// 	<h1>Hello {data.name}!</h1>
				// 	{languageTag.toUpperCase()}
				// `
				// const transformed = transformLayoutSvelte("", config, input, false)
				// expect(transformed).toMatch(transformSvelte(config, input))
			})
		})
	})
})
