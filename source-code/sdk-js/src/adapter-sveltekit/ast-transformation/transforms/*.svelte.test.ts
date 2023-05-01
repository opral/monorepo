import { describe, it } from "vitest"
import { transformSvelte } from "./*.svelte.js"
import { baseTestConfig } from "./test-helpers/config.js"
import type { TransformConfig } from "../config.js"
import { readFileSync } from "node:fs"

const testSvelteFile = readFileSync(__dirname + "/test-helpers/test.svelte").toString()

describe("transformSvelte", () => {
	it.todo("basics", async ({ expect }) => {
		const code = await transformSvelte(baseTestConfig, `
<script>
	import { i, languages, switchLanguage } from "@inlang/sdk-js"
</script>

{#each languages as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
`)
		expect(code).toMatchSnapshot()
	})


	it("languageInUrl is true", async ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			languageInUrl: false,
			sourceFileName: "test.svelte",
			sourceMapName: "test.svelte.js",
		}
		const code = await transformSvelte(config, testSvelteFile)
		expect(code).toMatchSnapshot()
	})

	it("languageInUrl is false", async ({ expect }) => {
		const code = await transformSvelte(baseTestConfig, testSvelteFile)
		expect(code).toMatchSnapshot()
	})
})

// NOTES
// - Can merge imports of
//     - import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";
//     - import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";
// - Removes the i in "import { i, ... } from '@inlang/sdk-js'" or the complete import if no other module is imported.
// - Adds "const { i } = getRuntimeFromContext()" or "const { i: ... } = getRuntimFromContext()" if import aliases are used
// - Allows import aliasing of "import {i as ...} from '@inlang/sdk-js"
