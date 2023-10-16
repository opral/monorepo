import dedent from "dedent"
import { describe, it, test, expect, vi } from "vitest"
import { transformLayoutSvelte } from "./+layout.svelte.js"
import { initTestApp } from "./test.utils.js"

describe("transformLayoutSvelte", () => {
	describe("root=true", () => {
		test("should insert code to an empty file", () => {
			const code = ""
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
				import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				</script>
				{#if languageTag || !sourceLanguageTag}{#key languageTag}<slot />{/key}{/if}"
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
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				console.info(data);
				</script>{#if languageTag || !sourceLanguageTag}{#key languageTag}

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
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
				import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				</script>
				<svelte:window on:load={onLoad} />{#if languageTag || !sourceLanguageTag}{#key languageTag}

				test

				{/key}{/if}<svelte:body on:click={onClick} />{#if languageTag || !sourceLanguageTag}{#key languageTag}

				other test

				{/key}{/if}<svelte:head>
					<title>test</title>
				</svelte:head>{#if languageTag || !sourceLanguageTag}{#key languageTag}

				{/key}{/if}<svelte:options tag=\\"test\\" />{#if languageTag || !sourceLanguageTag}{#key languageTag}

				random content{/key}{/if}"
			`)
		})

		test.todo("should wrap code inside special svelte elements", () => {
			const code = dedent`
				<script>
					import { i } from '@inlang/paraglide-js-sveltekit'
				</script>

				<svelte:head>
					<title>{i('title')}</title>
				</svelte:head>
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
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

		test("should remove @inlang/paraglide-js-sveltekit imports that are used reactively", () => {
			const code = dedent`
				<script>
					import { languageTag } from '@inlang/paraglide-js-sveltekit'
				</script>

				{languageTag}
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				</script>{#if languageTag || !sourceLanguageTag}{#key languageTag}

				{languageTag}{/key}{/if}"
			`)
		})

		test("should insert data export right after first import statements", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/paraglide-js-sveltekit"
					console.info(i("welcome"))
				</script>

				<slot />
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				console.info(i(\\"welcome\\"));
				</script>{#if languageTag || !sourceLanguageTag}{#key languageTag}

				<slot />{/key}{/if}"
			`)
		})

		test("should insert code snippets right after data export", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/paraglide-js-sveltekit"
					console.info(123)

					export let data

					console.info(i("welcome"))
				</script>

				<slot />
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				console.info(123);
				console.info(i(\\"welcome\\"));
				</script>{#if languageTag || !sourceLanguageTag}{#key languageTag}

				<slot />{/key}{/if}"
			`)
		})

		test("languageInUrl", () => {
			const code = ""
			const config = initTestApp({ options: { languageInUrl: true } })
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
				import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				</script>
				{#key languageTag}<slot />{/key}"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	describe("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		test("in context script tag", () => {
			const code = dedent`
				<script context>
					import '@inlang/paraglide-js-sveltekit/no-transforms';
				</script>`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toEqual(code)
		})

		test("in script tag", () => {
			const code = dedent`
				<script>
					import '@inlang/paraglide-js-sveltekit/no-transforms';
				</script>`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toEqual(code)
		})
	})

	describe("ensure getRuntimeFromContext is called the first time after the data export", () => {
		test("single import", () => {
			const code = dedent`
				<script lang="ts">
					import { browser } from '$app/environment'
					import { languages } from '@inlang/paraglide-js-sveltekit'

					console.log(languages)
				</script>
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script lang=\\"ts\\">
					import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				import { browser } from '$app/environment';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				const { languages } = getRuntimeFromContext();
				console.log(languages);
				</script>"
			`)
		})

		test("multiple imports", () => {
			const code = dedent`
				<script lang="ts">
					import { languages } from '@inlang/paraglide-js-sveltekit'
					import { switchLanguage } from '@inlang/paraglide-js-sveltekit'
					import { browser } from '$app/environment'

					const doSomething = () => console.log(languages)

					if (browser) doSomething()
				</script>

				<button on:click={() => switchLanguage('en')}>Switch Language</button>
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script lang=\\"ts\\">
					import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				import { browser } from '$app/environment';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				const { switchLanguage, languages } = getRuntimeFromContext();
				const doSomething = () => console.log(languages);
				if (browser)
				    doSomething();
				</script>{#if languageTag || !sourceLanguageTag}{#key languageTag}

				<button on:click={() => switchLanguage('en')}>Switch Language</button>{/key}{/if}"
			`)
		})

		test("data export already defined", () => {
			const code = dedent`
				<script lang="ts">
					import { languages } from '@inlang/paraglide-js-sveltekit'

					console.log(languages)

					export let data
				</script>
			`
			const config = initTestApp()
			const transformed = transformLayoutSvelte("", config, code, true)
			expect(transformed).toMatchInlineSnapshot(`
				"<script lang=\\"ts\\">
					import { browser } from '$app/environment';
				import { addRuntimeToContext, getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				import { getRuntimeFromData } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { addRuntimeToGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
				export let data;
				addRuntimeToGlobalThis(getRuntimeFromData(data));
				addRuntimeToContext(getRuntimeFromData(data));
				const { sourceLanguageTag } = getRuntimeFromContext();
				let { i, languageTag } = getRuntimeFromContext();
				$: if (browser) {
				    addRuntimeToGlobalThis(getRuntimeFromData(data));
				    addRuntimeToContext(getRuntimeFromData(data));
				    ({ i, languageTag } = getRuntimeFromContext());
				    document.body.parentElement?.setAttribute('lang', languageTag);
				}
				const { languages } = getRuntimeFromContext();
				console.log(languages);
				</script>"
			`)
		})
	})
})

describe.skip("transformLayoutSvelte", () => {
	describe("basics", () => {
		describe("root=true", () => {
			describe("transform @inlang/paraglide-js-sveltekit", () => {
				it("resolves imports correctly", async () => {
					const transformed = transformLayoutSvelte(
						"",
						initTestApp(),
						dedent`
							<script>
								import { languageTags, i } from "@inlang/paraglide-js-sveltekit"

								console.info(languageTags)
							</script>

							{i('hello')}
						`,
						true,
					)
					expect(transformed).toMatchInlineSnapshot(`
						"<script>import { browser } from \\"$app/environment\\";
						import { getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive\\";
						import { getRuntimeFromData } from \\"@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared\\";
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
						initTestApp({
							options: { languageInUrl: true },
						}),
						dedent`
							<script>
								import { languageTags, i } from "@inlang/paraglide-js-sveltekit"

								console.info(languageTags)
							</script>

							{i('hello')}
						`,
						true,
					)
					expect(transformed).toMatchInlineSnapshot(`
						"<script>import { browser } from \\"$app/environment\\";
						import { getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive\\";
						import { getRuntimeFromData } from \\"@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared\\";
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
				// const config = initVirtualModule()
				// const input = dedent`
				// 	<script>
				// 		import { languageTag } from '@inlang/paraglide-js-sveltekit'
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
