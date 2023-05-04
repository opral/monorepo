import { dedent } from "ts-dedent"
import { describe, it, expect } from "vitest"
import type { TransformConfig } from "../config.js"
import { transformSvelte } from "./*.svelte.js"
import { transformLayoutSvelte } from "./+layout.svelte.js"

describe("transformLayoutSvelte", () => {
	describe("basics", () => {
		describe("root=true", () => {
			it("adds code to an empty file", async () => {
				const code = await transformLayoutSvelte({} as TransformConfig, "", true)
				expect(code).toMatchInlineSnapshot(`
"<script>import { browser } from \\"$app/environment\\";
import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
export let data;
let language;
addRuntimeToContext(getRuntimeFromData(data));

({
  language: language
} = getRuntimeFromContext());

$:
if (browser && $language) {
  document.body.parentElement?.setAttribute(\\"lang\\", $language);
  localStorage.setItem(localStorageKey, $language);
}</script>
{#key $language}<slot />{/key}"
				`)
			})

			it("adds code to a file with arbitrary contents", async () => {
				const code = await transformLayoutSvelte(
					{} as TransformConfig,
					dedent`
<script>
import { onMount } from "svelte"

    export let data

    onMount(() => {
        console.log(123)
    })
</script>

<h1>Hello {data.name}!</h1>
				`,
					true,
				)
				// NOTES @ivan ist das richtig, dass ich unten den slot einfüge?
				// NOTES @ivan könntest du dir den code unten mal kurz angucken und auf richtigkeit überprüfen?
				expect(code).toMatchInlineSnapshot(`
"<script>import { browser } from \\"$app/environment\\";
import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
import { onMount } from \\"svelte\\"

onMount(() => {
    console.log(123)
})
export let data;
let language;
addRuntimeToContext(getRuntimeFromData(data));

({
    language: language
} = getRuntimeFromContext());

$:
if (browser && $language) {
    document.body.parentElement?.setAttribute(\\"lang\\", $language);
    localStorage.setItem(localStorageKey, $language);
}</script>

{#key $language}<h1>Hello {data.name}!</h1><slot />{/key}"
				`)
			})

			it("adds script tag if missing", async () => {
				const code = await transformLayoutSvelte(
					{} as TransformConfig,
					dedent`
<h1>Hello {data.name}!</h1>

<slot />
				`,
					true,
				)
				expect(code).toMatchInlineSnapshot(`
"<script>import { browser } from \\"$app/environment\\";
import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
export let data;
let language;
addRuntimeToContext(getRuntimeFromData(data));

({
  language: language
} = getRuntimeFromContext());

$:
if (browser && $language) {
  document.body.parentElement?.setAttribute(\\"lang\\", $language);
  localStorage.setItem(localStorageKey, $language);
}</script>
{#key $language}<h1>Hello {data.name}!</h1>

<slot />{/key}"
				`)
			})
			// NOTES @ivan this test below is not how I understood it... Currently it will insert a slot in this case
			// NOTES @ivan can you please look at the position of the console log in the script tag below?
			it.skip("doesn't output markup if no markup is present", async () => {
				const code = await transformLayoutSvelte(
					{} as TransformConfig,
					dedent`
<script>
console.log(1)
</script>
				`,
					true,
				)
				expect(code).toMatchInlineSnapshot(`
"<script>import { browser } from \\"$app/environment\\";
import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
console.log(1)
export let data;
let language;
addRuntimeToContext(getRuntimeFromData(data));

({
  language: language
} = getRuntimeFromContext());

$:
if (browser && $language) {
  document.body.parentElement?.setAttribute(\\"lang\\", $language);
  localStorage.setItem(localStorageKey, $language);
}</script>"
				`)
			})
		})

		describe("root=false", () => {
			it("is a proxy for transformSvelte", async () => {
				const config = {} as TransformConfig
				const input = dedent`
<script>
    export let data
</script>

<h1>Hello {data.name}!</h1>
				`
				const code = await transformLayoutSvelte(config, input, false)
				expect(code).toMatch(await transformSvelte(config, input))
			})
		})
	})

	describe("transform @inlang/sdk-js", () => {
		it("resolves imports correctly", async () => {
			const code = await transformLayoutSvelte(
				{} as TransformConfig,
				dedent`
<script>
    import { languages, i } from "@inlang/sdk-js"

    console.log(languages)
</script>

{i('hello')}
			`,
				true,
			)
			// NOTES @ivan look at the declaration of languages below pls. it's a let now instead of const.
			expect(code).toMatchInlineSnapshot(`
"<script>import { browser } from \\"$app/environment\\";
import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
import { getRuntimeFromData } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
export let data;
let languages, i, language;
addRuntimeToContext(getRuntimeFromData(data));

({
    languages: languages,
    i: i,
    language: language
} = getRuntimeFromContext());

$:
if (browser && $language) {
    document.body.parentElement?.setAttribute(\\"lang\\", $language);
    localStorage.setItem(localStorageKey, $language);
}

console.log(languages)</script>

{#key $language}{$i('hello')}<slot />{/key}"
			`)
		})
	})
})
