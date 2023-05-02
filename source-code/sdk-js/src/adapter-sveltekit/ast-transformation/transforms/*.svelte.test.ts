import { describe, it } from "vitest"
import { transformSvelte } from "./*.svelte.js"
import { baseTestConfig } from "./test-helpers/config.js"
import type { TransformConfig } from "../config.js"

describe("transformSvelte", () => {
	it("basics", async ({ expect }) => {
		const code = await transformSvelte(
			baseTestConfig,
			`
<script>
	import { i, languages, switchLanguage } from "@inlang/sdk-js"
</script>

{#each languages as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
`,
		)
		expect(code).toMatchInlineSnapshot(`
			"
			<script>import { getRuntimeFromContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";

			const {
			    i: i,
			    languages: languages,
			    switchLanguage: switchLanguage
			} = getRuntimeFromContext();</script>

			{#each $languages as lang}
				<button on:click={() =>$switchLanguage(lang)}>{lang}</button>
			{/each}

			<h1>{$i(\\"welcome\\")}</h1>
			"
		`)
	})

	it("languageInUrl is true", async ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			languageInUrl: false,
			sourceFileName: "test.svelte",
			sourceMapName: "test.svelte.js",
		}
		const code = await transformSvelte(
			config,
			`
<script lang="ts" context="module">
</script>

<script lang="ts">
	export let prop: string
	import { i as iStore, language as iLanguage } from '@inlang/sdk-js';
	const blue = iStore;
	const green = iLanguage
	console.log(blue)
</script>

<style>
	.red {
		color: red;
	}
</style>

<h1 class="red">{prop}</h1>
<h1 class="red">{iStore}</h1>
<h1 class="red">{iLanguage}</h1>
`,
		)
		expect(code).toMatchInlineSnapshot(`
			"
			<script lang=\\"ts\\" context=\\"module\\"></script>

			<script lang=\\"ts\\">import { getRuntimeFromContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";

			const {
			  i: iStore,
			  language: iLanguage
			} = getRuntimeFromContext();

			export let prop;
			const blue = $iStore;
			const green = $iLanguage;
			console.log(blue);</script>

			<style>
				.red {
					color: red;
				}
			</style>

			<h1 class=\\"red\\">{prop}</h1>
			<h1 class=\\"red\\">{$iStore}</h1>
			<h1 class=\\"red\\">{$iLanguage}</h1>
			"
		`)
	})

	it("languageInUrl is false", async ({ expect }) => {
		const code = await transformSvelte(
			baseTestConfig,
			`
<script lang="ts" context="module">
</script>

<script lang="ts">
	export let prop: string
	import { i as iStore, language as iLanguage } from '@inlang/sdk-js';
	const blue = iStore;
	const green = iLanguage
	console.log(blue)
</script>

<style>
	.red {
		color: red;
	}
</style>

<h1 class="red">{prop}</h1>
<h1 class="red">{iStore}</h1>
<h1 class="red">{iLanguage}</h1>
`,
		)
		expect(code).toMatchInlineSnapshot(`
			"
			<script lang=\\"ts\\" context=\\"module\\"></script>

			<script lang=\\"ts\\">import { getRuntimeFromContext } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";

			const {
			  i: iStore,
			  language: iLanguage
			} = getRuntimeFromContext();

			export let prop;
			const blue = $iStore;
			const green = $iLanguage;
			console.log(blue);</script>

			<style>
				.red {
					color: red;
				}
			</style>

			<h1 class=\\"red\\">{prop}</h1>
			<h1 class=\\"red\\">{$iStore}</h1>
			<h1 class=\\"red\\">{$iLanguage}</h1>
			"
		`)
	})
})

// NOTES
// - Can merge imports of
//     - import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";
//     - import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";
// - Removes ALL imports from "@inlang/sdk-js"
// - Allows import aliasing of "import {i as ...} from '@inlang/sdk-js"
// - Destructures all previosly imported module ALIASES from "@inlang/sdk-js" at "... = getRuntimeFromContext()"
// - Prepends the imports ALIASES from "@inlang/sdk-js" wherever they are used in the code with a "$" in the reactive case
